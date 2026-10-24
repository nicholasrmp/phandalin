// Magias de utilidade FORA do combate: a camada do jogo (menus, telas, cenas).
//
// A regra mora em `rules/utilidade.js` (espaços, relógio, concentração,
// vantagem nos testes). Aqui fica o que toca a tela e a cena:
//
//   conjurarComTela       conjura, conta o que aconteceu num painel e executa o
//                         "gancho" da cena (a porta que abre, o objeto puxado)
//   lancar                o mesmo, sem painel: devolve o texto (as conversas o
//                         põem na própria página)
//   escolherEConjurar     o caminho da barra de magias: pergunta o que faltar
//                         (alvo, ritual, efeito) e conjura
//   opcoesDeMagia         as linhas do menu do botão direito
//   perguntarAosMortos / conversarComAnimal   as conversas das magias de falar
//   auras                 as casas que o Detectar Magia acende no mapa
//
// GANCHOS. Uma cena diz o que nela aceita magia, em
// `capitulo.ganchosMagicos(c)`: uma lista de
//   { id, tipo, x, y, nome, motivo?, fazer?(c, {spell}), aura? }
// com `tipo`:
//   'trancada'   fechadura que o Abrir destranca
//   'alcance'    objeto que as Mãos Mágicas pegam, puxam ou acionam a distância
//   'quebrado'   objeto que o Consertar refaz
//   'magico'     objeto, área ou criatura com aura ({ escola, texto }) que o
//                Detectar Magia revela
// `motivo` (texto) impede o uso e aparece em cinza no menu. Sem ganchos, a
// cena não oferece essas magias — a cena decide, e não esta camada.

import { narrar } from '../view/narrativa.js';
import { getSpell, APRIMORAR } from '../rules/spells.js';
import { iconeDeMagia } from '../art/icons.js';
import { distanceFt } from '../core/grid.js';
import { podeVer } from '../rules/luz.js';
import { hasCondition } from '../rules/conditions.js';
import {
  UTIL, TRUQUES, estadoDe, conjurarFora, podeConjurarFora, ativaDe, ativasDoGrupo, avancar, relogioTexto,
  magiasForaDoHeroi, sondarMente, motivoDeMortoMudo, falaPorMensagem, chaveDoNpc, infoDoItem, tempoDeConjuracao,
} from '../rules/utilidade.js';
import { PENSAMENTOS, MORTOS, MUDOS, ANIMAIS, eAnimal } from './magias-fora-dados.js';
import { itemDeId } from '../rules/equipment.js';

const NOME_HAB = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };

// ------------------------------------------------------------ contexto ----

/**
 * O contexto das magias numa cena: o estado do grupo, os heróis vivos, os dados e o
 * registro. `enc` pode ser o encontro (exploração) ou o `fora` da vila.
 */
export function ctxDe(app, enc = app.enc) {
  const campanha = (app.campanha ??= {});
  return {
    app, enc, estado: estadoDe(campanha), rng: enc.rng,
    herois: () => (enc.herois ?? enc.combatants.filter((c) => c.side === 'party')).filter((c) => !c.dead && c.hp > 0),
    say: (t) => enc.say?.('magia', t),
  };
}

const horas = (min) => (min >= 120 ? `${Math.round(min / 60)} horas` : min >= 60 ? '1 hora' : min === 1 ? '1 minuto' : `${min} minutos`);
const dura = (spellId) => horas(UTIL[spellId]?.min ?? 0);
const NOME_ESCOLHA = { tocha: 'a tocha' };

/** O que a magia fez, em português de mesa, a partir do resultado da regra. */
function contar(x, c, r, { alvo = null, opcao = null } = {}) {
  const id = r.spell.id;
  const res = r.resultado;
  const nome = alvo?.name ?? 'o alvo';
  const t = [];
  if (r.ritual) t.push(`${c.name} conjura ${r.spell.name} como ritual: dez minutos de gestos e murmúrios, e nenhum espaço gasto.`);
  const dc = res.dc;
  switch (id) {
    case 'luz': t.push(`${alvo.name} passa a brilhar como uma tocha, sem fogo: luz clara em 6 m e penumbra por mais 6, por ${dura(id)}.`); break;
    case 'orientacao': t.push(`${c.name} toca ${alvo.name}. No próximo teste de perícia dele soma 1d4, e a magia acaba (ou em 1 minuto).`); break;
    case 'visaoNoEscuro': t.push(`Os olhos de ${alvo.name} ganham um brilho: enxerga no escuro até 18 m por ${dura(id)}.`); break;
    case 'passoSemRastro': t.push(`Um véu de sombra e silêncio acompanha o grupo: +10 em Furtividade por ${dura(id)}, enquanto ficarem juntos (a até 9 m de ${c.name}).`); break;
    case 'aprimorarAtributo': {
      const o = APRIMORAR[res.opcao ?? 'urso'];
      t.push(`${o.nome}: ${alvo.name} tem vantagem nos testes de ${NOME_HAB[o.hab]} por ${dura(id)}.${o.pv ? ' Ganha PV temporários.' : ''}`);
      break;
    }
    case 'sugestao':
      t.push(res.resistiu
        ? `${alvo.name} resiste (SAB ${res.resistencia.total} contra CD ${dc}) e franze a testa, como quem sentiu algo mexer na cabeça.`
        : `${alvo.name} falha (SAB ${res.resistencia.total} contra CD ${dc}) e acha a ideia de ${c.name} muito razoável. O próximo teste de Persuasão, Intimidação ou Enganação com ele é cumprido.`);
      break;
    case 'enfeiticarPessoa':
      t.push(res.resistiu
        ? `${alvo.name} resiste (SAB ${res.resistencia.total} contra CD ${dc}). A magia não pega, e ele só desconfia.`
        : `${alvo.name} falha (SAB ${res.resistencia.total} contra CD ${dc}): trata ${c.name} como um velho conhecido. Vantagem nos testes de Carisma com ele por ${dura(id)}; depois, ele saberá.`);
      break;
    case 'ilusaoMenor': t.push(`${c.name} desenha no ar uma imagem de coisa pequena (um caixote, uma pedra) e um ruído que distrai. Por 1 minuto, vantagem em Enganação.`); break;
    case 'oracaoDeCura':
      t.push(`O grupo reza por dez minutos.${res.curas.length ? ` ${res.curas.map((k) => `${k.alvo.name} +${k.cura} PV`).join('; ')}.` : ''}`);
      break;
    case 'bomFruto':
      t.push(`Dez frutinhas surgem e são comidas no ato.${res.curas.length ? ` ${res.curas.map((k) => `${k.alvo.name} +${k.cura} PV`).join('; ')}.` : ''}`);
      break;
    case 'taumaturgia': t.push(`A voz de ${c.name} troveja, as velas se curvam e o chão estremece. Por 1 minuto, vantagem em Intimidação.`); break;
    case 'amizade': t.push(`${c.name} abre o melhor sorriso e deixa ${nome} à vontade. Vantagem nos testes de Carisma com ele por 1 minuto (enquanto concentrado). Depois ele vai se lembrar de que foi influenciado.`); break;
    case 'maoMagica': break;
    case 'prestidigitacao': case 'arteDruidica': {
      const k = res.truque;
      if (k.opcao === 'tocha') t.push(`A tocha de ${k.dono.name} ${k.acesa ? 'acende sozinha, sem pederneira' : 'se apaga num sopro de ar frio'}.`);
      else if (k.opcao === 'clima') t.push(`${c.name} cheira o vento e sente a terra: nas próximas 24 horas, ${k.clima}.`);
      else t.push({
        limpar: `${c.name} estala os dedos: a sujeira some (ou aparece) onde apontou.`,
        aquecer: `${c.name} passa a mão sobre a comida e ela esquenta (ou esfria) na hora, por uma hora.`,
        fumaca: `Uma fumaça colorida sobe do chão numa espiral e some.`,
        marca: `Um símbolo pequeno e um cheiro persistente ficam onde ${c.name} tocou, por uma hora.`,
        flor: `Um broto se abre na palma de ${c.name}, perfumado, e murcha ao fim de um minuto.`,
        sinal: `Um som de bicho e um aroma de mato fresco passam como um recado, e se vão.`,
      }[k.opcao] ?? `${c.name} faz um truque pequeno e gracioso.`);
      break;
    }
    case 'consertar': break;
    case 'luzesDancantes': t.push(`Quatro luzinhas começam a girar em volta de ${c.name}: cada uma só em penumbra num raio de 3 m, por 1 minuto (concentração).`); break;
    case 'mensagem': t.push(`${c.name} cobre a boca e sussurra: o som viaja até ${nome} e só ele ouve. Por 1 minuto ele pode responder baixinho, a até 36 m.`); break;
    case 'detectarMagia': {
      t.push(`${c.name} fecha os olhos e abre uma segunda visão: por 10 minutos, o que é mágico a até 9 m brilha, com a cor da sua escola.`);
      const mochila = res.mochila ?? [];
      if (mochila.length) t.push(`Na mochila do grupo: ${mochila.map((m) => `${m.nome} (${m.dono.name}, ${m.escola})`).join('; ')}.`);
      break;
    }
    case 'identificar': {
      const i = res.info;
      t.push(`${c.name} estuda ${i.nome} por um minuto: ${i.linhas.join(' ')}`);
      break;
    }
    case 'compreenderIdiomas': t.push(`As palavras estranhas deixam de ser ruído para ${c.name}: por 1 hora, entende qualquer idioma falado e lê o que tocar.`); break;
    case 'disfarcarSe': t.push(`O rosto, as roupas e a postura de ${c.name} mudam como uma cortina que cai. Por 1 hora passa por um dos de capa vermelha. Vantagem em Enganação.`); break;
    case 'falarComAnimais': t.push(`Os sons dos bichos viram palavras para ${c.name} por 10 minutos. Vantagem em Lidar com Animais.`); break;
    case 'abrir': break;
    case 'detectarPensamentos': t.push(`${c.name} afina o ouvido para dentro: por 1 minuto ouve os pensamentos de superfície de quem está a até 9 m. Para sondar a mente de alguém, use a opção de sondar na conversa. (Concentração.)`); break;
    case 'verOInvisivel': t.push(`O ar ao redor de ${c.name} ganha contornos nítidos: por 1 hora enxerga o que está invisível.`); break;
    case 'falarComOsMortos': t.push(`Um sopro frio sai da boca do cadáver de ${nome}, que se prepara para responder.`); break;
    default: t.push(`${c.name} conjura ${r.spell.name}.`);
  }
  for (const f of r.fim ?? []) t.push(f);
  return t;
}

// ----------------------------------------------------------- conjurar ----

/** Conjura, registra e devolve { r, texto } (sem tela). */
export function lancar(x, c, spellId, opts = {}) {
  const { estado, rng } = x;
  const herois = x.herois();
  const r = conjurarFora(estado, c, spellId, { herois, rng, enc: x.enc, ...opts });
  if (!r.ok) return { r, texto: [r.why] };
  const texto = contar(x, c, r, opts);
  x.say(`${c.name} conjura ${r.spell.name}${opts.ritual ? ' (ritual)' : ''}${r.circulo > 0 && !opts.ritual ? `, ${r.circulo}º círculo` : ''}.`);
  if (r.resultado.tipo === 'sugestao' || r.resultado.tipo === 'enfeiticar') x.say(texto[texto.length - 1] ?? '');
  return { r, texto };
}

/** Conjura com painel de resultado e executa o gancho da cena, se a magia pedir. */
export async function conjurarComTela(app, c, spellId, opts = {}) {
  const x = ctxDe(app, opts.enc ?? app.enc);
  const u = UTIL[spellId];
  const { r, texto } = lancar(x, c, spellId, opts);
  if (!r.ok) { app.refuse?.(c, r.why); return r; }
  const spell = r.spell;
  const paginas = [];
  if (texto.length) paginas.push({ titulo: spell.name, texto });
  if (paginas.length) await narrar(app.root, { formato: 'painel', paginas });
  if (u.gancho && opts.gancho?.fazer) await opts.gancho.fazer(c, { spell: spellId });
  if (spellId === 'falarComOsMortos' && opts.alvo) await perguntarAosMortos(app, c, opts.alvo);
  app.refresh?.();
  return r;
}

// --------------------------------------------------------- escolhas ----

/** Uma lista de escolhas no painel. Devolve o `valor` da escolhida ou null. */
async function escolher(app, titulo, texto, itens) {
  const r = await narrar(app.root, {
    formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], lista: true,
    escolhas: [...itens.map((i) => ({ rotulo: i.rotulo, detalhe: i.detalhe, motivo: i.motivo, valor: { v: i.valor } })), { rotulo: 'Cancelar', valor: { v: null } }],
  });
  return r?.v ?? null;
}

/** O gancho vale nesta casa? (Um poço tem várias: `casas`; os outros, só a sua.) */
export const cobre = (g, t) => (g.casas ? g.casas.some(([x, y]) => x === t.x && y === t.y) : g.x === t.x && g.y === t.y);

export const ganchosPerto = (app, c, tipo, alcanceFt) => (app.capitulo?.ganchosMagicos?.(c) ?? [])
  .filter((g) => g.tipo === tipo && (!c.pos || distanceFt(c.pos, g) <= alcanceFt));

/** As criaturas vivas (não do grupo) que o herói alcança com a magia. */
function criaturasAoAlcance(app, c, alcanceFt) {
  return (app.enc?.combatants ?? []).filter((m) => m.side !== 'party' && !m.dead && m.hp > 0 && !m.fugiu && !m.preso0
    && distanceFt(c.pos, m.pos) <= alcanceFt && podeVer(app.enc, c, m));
}

/**
 * A barra de magias: pergunta o que a magia pede (ritual, alvo, efeito) e
 * conjura. Cancelar não gasta nada.
 */
export async function escolherEConjurar(app, c, spellId) {
  const u = UTIL[spellId];
  const spell = getSpell(spellId);
  const x = ctxDe(app);
  const opts = {};
  const normal = podeConjurarFora(c, spellId);
  const rit = spell.ritual ? podeConjurarFora(c, spellId, { ritual: true }) : { ok: false };
  if (!normal.ok && !rit.ok) { app.refuse?.(c, normal.why); return null; }
  if (rit.ok) {
    if (!normal.ok) opts.ritual = true;
    else {
      const modo = await escolher(app, spell.name, 'Como conjurar?', [
        { rotulo: 'Gastar um espaço de magia', detalhe: 'na hora', valor: 'normal' },
        { rotulo: 'Conjurar como ritual', detalhe: '+10 minutos, sem gastar espaço', valor: 'ritual' },
      ]);
      if (!modo) return null;
      if (modo === 'ritual') opts.ritual = true;
    }
  }
  const herois = x.herois();
  if (u.alvo === 'aliado') {
    const a = await escolher(app, spell.name, 'Em quem?', herois.map((h) => ({ rotulo: h.name, detalhe: h === c ? 'em si' : null, valor: h })));
    if (!a) return null;
    opts.alvo = a;
  } else if (u.alvo === 'criatura') {
    const alc = u.alcance ?? spell.rangeFt;
    const cand = criaturasAoAlcance(app, c, alc);
    if (!cand.length) { app.refuse?.(c, `ninguém ao alcance (${alc} pés) à vista`); return null; }
    const a = await escolher(app, spell.name, 'Em quem?', cand.map((m) => ({ rotulo: m.name, detalhe: `${distanceFt(c.pos, m.pos)} pés`, valor: m })));
    if (!a) return null;
    opts.alvo = a;
  } else if (u.alvo === 'morto') {
    const cand = (app.enc?.combatants ?? []).filter((m) => m.dead && distanceFt(c.pos, m.pos) <= spell.rangeFt && !motivoDeMortoMudo(m));
    if (!cand.length) { app.refuse?.(c, 'nenhum cadáver ao alcance (3 m) que ainda possa responder'); return null; }
    const a = await escolher(app, spell.name, 'Qual corpo?', cand.map((m) => ({ rotulo: m.name, valor: m })));
    if (!a) return null;
    opts.alvo = a;
  } else if (u.alvo === 'item') {
    const itens = herois.flatMap((h) => (h.bag ?? []).filter((i) => i.qtd > 0).map((i) => ({ h, i, d: itemDeId(i.id)?.dados })));
    if (!itens.length) { app.refuse?.(c, 'ninguém carrega nada para examinar'); return null; }
    const a = await escolher(app, spell.name, 'Qual objeto?', itens.map(({ h, i, d }) => ({ rotulo: d?.name ?? i.id, detalhe: h.name, valor: { id: i.id } })));
    if (!a) return null;
    opts.alvo = a;
  } else if (u.alvo === 'objeto') {
    const alc = spell.rangeFt;
    const gs = ganchosPerto(app, c, u.gancho, alc).filter((g) => !g.motivo);
    if (!gs.length) { app.refuse?.(c, 'nada ao alcance que esta magia possa mudar'); return null; }
    const g = gs.length === 1 ? gs[0] : await escolher(app, spell.name, 'Onde?', gs.map((k) => ({ rotulo: k.nome, valor: k })));
    if (!g) return null;
    opts.gancho = g;
  } else if (u.alvo === 'escolha') {
    const o = await escolher(app, spell.name, 'O que você faz?', TRUQUES[spellId].map((k) => ({ rotulo: k.rotulo, detalhe: k.detalhe, valor: k.id })));
    if (!o) return null;
    opts.opcao = o;
    if (o === 'tocha') {
      const a = await escolher(app, spell.name, 'A tocha de quem?', herois.map((h) => ({ rotulo: h.name, valor: h })));
      if (!a) return null;
      opts.alvo = a;
    }
  }
  if (u.escolhe === 'atributo') {
    const o = await escolher(app, spell.name, 'Qual atributo?', Object.entries(APRIMORAR).map(([id, k]) => ({ rotulo: k.nome, detalhe: `vantagem em ${NOME_HAB[k.hab]}`, valor: id })));
    if (!o) return null;
    opts.opcao = o;
  }
  return conjurarComTela(app, c, spellId, opts);
}

// -------------------------------------------------------------- menu ----

/**
 * O detalhe de uma linha de magia: `custo · duração · ◎ concentração`.
 * Custo: "truque", "1 espaço de 2º (restam 3)" ou "ritual, 10 min, sem espaço".
 */
export function detalheDeMagia(c, s, { ritual = false } = {}) {
  const u = UTIL[s.id];
  const pode = podeConjurarFora(c, s.id, ritual ? { ritual: true } : {});
  let custo;
  if (ritual) custo = 'ritual, 10 min, sem espaço';
  else if (s.level === 0) custo = 'truque';
  else {
    const n = pode.ok ? pode.circulo : s.level;
    custo = `1 espaço de ${n}º (restam ${c.spellcasting?.slots?.[n] ?? 0})`;
  }
  const tempo = tempoDeConjuracao(s.id, { ritual });
  return [custo, u.min ? dura(s.id) : (tempo && !ritual ? `leva ${tempo} min` : null), u.conc ? '◎ concentração' : null].filter(Boolean).join(' · ');
}

/**
 * Ordena as linhas de magia: o que dá para fazer agora primeiro, depois as
 * recusadas; "esperar" no fim; os rituais num bloco à parte, sob o subtítulo.
 */
export const GRUPO_RITUAIS = 'Rituais (10 min, sem espaço)';
function organizar(ops) {
  const nivel = (o) => o.circulo ?? 0;
  const ordem = (a, b) => (Boolean(a.motivo) - Boolean(b.motivo)) || nivel(a) - nivel(b) || String(a.rotulo).localeCompare(String(b.rotulo), 'pt-BR');
  const magias = ops.filter((o) => o.grupo === 'Magias de utilidade' && !o.ritual && !o.fixo).sort(ordem);
  const fim = ops.filter((o) => o.fixo);
  const rituais = ops.filter((o) => o.ritual).sort(ordem).map((o) => ({ ...o, grupo: GRUPO_RITUAIS }));
  const resto = ops.filter((o) => o.grupo !== 'Magias de utilidade' && !o.ritual && !o.fixo);
  return [...magias, ...fim, ...rituais, ...resto];
}

const icone = (s) => iconeDeMagia(s);

/**
 * As linhas do menu do botão direito para o herói `c`, numa casa. `quem` diz o
 * que há nela: { occ, tile, sup }. Devolve opções no formato de `interacoes.js`.
 */
export function opcoesDeMagia(app, c, { occ = null, tile = null } = {}) {
  if (!c || !c.spellcasting || !app.capitulo?.explorando) return [];
  const x = ctxDe(app);
  const ops = [];
  const lista = magiasForaDoHeroi(c);
  const linha = (s, extra = {}) => {
    const u = UTIL[s.id];
    const pode = podeConjurarFora(c, s.id, extra.ritual ? { ritual: true } : {});
    return {
      grupo: 'Magias de utilidade', rotulo: `${s.name}${extra.ritual ? ' (ritual)' : ''}`,
      icone: icone(s), circulo: s.level, motivo: extra.motivo ?? (pode.ok ? null : pode.why),
      detalhe: detalheDeMagia(c, s, { ritual: Boolean(extra.ritual) }),
      alvoPrevia: extra.previa ?? null,
      fazer: extra.fazer,
    };
  };

  if (occ) {
    const vivo = !occ.dead;
    for (const s of lista) {
      const u = UTIL[s.id];
      const alvoCriatura = u.alvo === 'criatura' && vivo && occ.side !== 'party';
      const alvoAliado = u.alvo === 'aliado' && occ.side === 'party' && vivo;
      const alvoMorto = u.alvo === 'morto' && occ.dead;
      if (!(alvoCriatura || alvoAliado || alvoMorto)) continue;
      const alc = u.alcance ?? s.rangeFt;
      const longe = c.pos && occ.pos && distanceFt(c.pos, occ.pos) > alc ? `longe demais — ${alc} pés` : null;
      const abre = async (opcao = null) => conjurarComTela(app, c, s.id, { alvo: occ, opcao });
      ops.push(linha(s, {
        motivo: longe ?? (alvoMorto ? motivoDeMortoMudo(occ) : null) ?? (podeConjurarFora(c, s.id).ok ? null : podeConjurarFora(c, s.id).why),
        previa: occ,
        fazer: async () => {
          if (s.id === 'mensagem') {
            const r = await abre();
            if (r?.ok) await app.conversar(occ);
            return;
          }
          if (u.escolhe === 'atributo') {
            const o = await escolher(app, s.name, 'Qual atributo?', Object.entries(APRIMORAR).map(([id, k]) => ({ rotulo: k.nome, detalhe: `vantagem em ${NOME_HAB[k.hab]}`, valor: id })));
            if (o) await abre(o);
            return;
          }
          await abre();
        },
      }));
    }
    // Falar com Animais, já ativa: o bicho responde.
    if (vivo && eAnimal(occ) && occ.side !== 'party' && ativaDe(x.estado, x.herois(), 'falarComAnimais')) {
      ops.push({ grupo: 'Magias de utilidade', rotulo: 'Falar com o animal', icone: 'magia-falarComAnimais', detalhe: 'Falar com Animais', fazer: () => conversarComAnimal(app, c, occ) });
    }
    return organizar(ops);
  }

  // Casa vazia ou objeto: os ganchos da cena nesta casa.
  const gs = (app.capitulo?.ganchosMagicos?.(c) ?? []).filter((g) => tile && cobre(g, tile));
  for (const g of gs) {
    for (const s of lista) {
      const u = UTIL[s.id];
      if (u.gancho !== g.tipo) continue;
      const longe = c.pos && distanceFt(c.pos, g) > s.rangeFt ? `longe demais — ${s.rangeFt} pés` : null;
      ops.push(linha(s, { motivo: g.motivo ?? longe ?? (podeConjurarFora(c, s.id).ok ? null : podeConjurarFora(c, s.id).why), fazer: () => conjurarComTela(app, c, s.id, { gancho: g }) }));
    }
    if (g.tipo === 'magico' && g.aura) {
      const det = ativaDe(x.estado, x.herois(), 'detectarMagia');
      const dono = det && x.herois().find((h) => h.id === det.por);
      if (dono && distanceFt(dono.pos, g) <= 30) {
        ops.push({ grupo: 'Magias de utilidade', rotulo: 'Ler a aura (Detectar Magia)', icone: 'magia-detectarMagia', detalhe: g.nome,
          fazer: () => app.mostrarTexto(g.nome, [`Aura de ${g.aura.escola}.`, g.aura.texto]) });
      }
    }
  }
  return organizar(ops);
}

/** As linhas do menu quando se clica no PRÓPRIO herói (ou num aliado): auto-alvo e área. */
export function opcoesDoHeroi(app, c, alvo) {
  if (!c?.spellcasting || !app.capitulo?.explorando) return [];
  const x = ctxDe(app);
  const ops = [];
  for (const s of magiasForaDoHeroi(c)) {
    const u = UTIL[s.id];
    const ehSi = alvo === c;
    // Em si: auto-alvo, área, grupo, escolha, item. Os de aliado e de criatura saem em `opcoesDeMagia`.
    if (!ehSi) continue;
    if (['criatura', 'morto', 'objeto', 'aliado'].includes(u.alvo)) continue;
    const variantes = [{ ritual: false }];
    if (s.ritual && podeConjurarFora(c, s.id, { ritual: true }).ok) variantes.push({ ritual: true });
    for (const v of variantes) {
      const pode = podeConjurarFora(c, s.id, v);
      ops.push({
        grupo: 'Magias de utilidade', rotulo: `${s.name}${v.ritual ? ' (ritual)' : ''}`, icone: icone(s), circulo: s.level,
        motivo: pode.ok ? null : pode.why,
        detalhe: detalheDeMagia(c, s, { ritual: v.ritual }), ritual: v.ritual,
        fazer: () => (u.alvo === 'item' || u.alvo === 'escolha' || u.escolhe
          ? escolherEConjurar(app, c, s.id)
          : conjurarComTela(app, c, s.id, { ritual: v.ritual })),
      });
    }
  }
  // O tempo, quando há magia de duração rodando.
  const ativas = ativasDoGrupo(x.estado, x.herois());
  if (ativas.length || x.estado.minutos > 0) {
    ops.push({
      grupo: 'Magias de utilidade', fixo: true, rotulo: 'Esperar 10 minutos', icone: 'acao-esperar', detalhe: ativas.length ? `${ativas.length} magia(s) ativa(s) · ${relogioTexto(x.estado)}` : relogioTexto(x.estado),
      fazer: () => esperar(app, 10),
    });
  }
  return organizar(ops);
}

/** O tempo passa sem fazer nada: as magias de duração correm. */
export async function esperar(app, minutos) {
  const x = ctxDe(app);
  const fim = avancar(x.estado, minutos, x.herois());
  for (const f of fim) x.say(f);
  x.say(`Passam ${minutos} minutos. (${relogioTexto(x.estado)} desde o começo da cena.)`);
  if (fim.length) await app.mostrarTexto('O tempo passa', [`Passam ${minutos} minutos.`, ...fim]);
  app.refresh?.();
}

// ------------------------------------------------------------- auras ----

/** As casas com aura que o Detectar Magia ativo mostra agora: [{ x, y, escola }]. */
export function auras(app) {
  if (!app.capitulo?.explorando || !app.enc) return [];
  const x = ctxDe(app);
  const a = ativaDe(x.estado, x.herois(), 'detectarMagia');
  if (!a) return [];
  const dono = x.herois().find((h) => h.id === a.por);
  if (!dono) return [];
  return (app.capitulo.ganchosMagicos?.(dono) ?? [])
    .filter((g) => g.tipo === 'magico' && g.aura && distanceFt(dono.pos, g) <= 30)
    .flatMap((g) => (g.casas ?? [[g.x, g.y]]).map(([x, y]) => ({ x, y, escola: g.aura.escola, nome: g.nome })));
}

// ----------------------------------------------- conversas das magias ----

/** Os pensamentos de superfície de um NPC, no nó atual da conversa (ou o geral). */
export function pensamentoDe(npc, noId = null, noPensa = null) {
  if (noPensa) return typeof noPensa === 'function' ? noPensa(npc) : noPensa;
  const t = PENSAMENTOS[npc.defId] ?? PENSAMENTOS[npc.id] ?? PENSAMENTOS[String(npc.name).toLowerCase()];
  return t?.nos?.[noId] ?? t?.padrao ?? PENSAMENTOS._geral;
}

/** Sondar a mente do NPC na conversa. Devolve as frases da cena. */
export function sondar(x, c, npc, noId = null, noPensa = null) {
  const r = sondarMente(x.estado, x.herois(), c, npc, x.rng);
  if (!r.ok) return [r.why];
  if (r.jaFechada) return [`${npc.name} fechou a mente: só um zumbido surdo.`];
  if (r.percebeu) return [`${npc.name} estremece e franze a testa, como quem sentiu uma mão na nuca. A mente dele se fecha e a magia termina. (SAB ${r.resistencia.total} contra CD ${r.resistencia.dc}.)`];
  const t = [`Pensamentos de ${npc.name}: ${pensamentoDe(npc, noId, noPensa)}`];
  if (!r.jaLida) t.push(`${npc.name} não resistiu, mas sente que alguém lhe lê a mente.`);
  if (!r.jaLida) t.push(`Sabendo o que ele quer ouvir, os testes de Persuasão e de Enganação com ele passam a ter vantagem.`);
  x.say(`${c.name} lê a mente de ${npc.name}.`);
  return t;
}

/** Falar com os Mortos: o corpo responde, uma pergunta por vez, até cinco. */
export async function perguntarAosMortos(app, c, corpo) {
  if (MUDOS.has(corpo.defId)) {
    await app.mostrarTexto(corpo.name, MORTOS._muda);
    return;
  }
  const todas = MORTOS[corpo.defId] ?? MORTOS._geral;
  const restam = todas.slice(0, 5).map((p, i) => ({ p, i }));
  const feitas = new Set();
  const falas = [];
  while (feitas.size < Math.min(5, todas.length)) {
    const i = await escolher(app, `${corpo.name} (morto)`, [`O corpo responde em voz seca e curta. Perguntas restantes: ${Math.min(5, todas.length) - feitas.size}.`, ...falas],
      restam.filter(({ i: k }) => !feitas.has(k)).map(({ p, i: k }) => ({ rotulo: p[0], valor: k })));
    if (i == null) break;
    feitas.add(i);
    falas.push(`${todas[i][0]} — ${todas[i][1]}`);
  }
  if (falas.length) {
    await app.mostrarTexto(corpo.name, [`Os mortos não mentem, mas respondem pouco. ${corpo.name} cala.`, ...falas]);
  }
}

/** Falar com Animais: o bicho responde. */
export async function conversarComAnimal(app, c, animal) {
  const t = ANIMAIS[animal.defId] ?? ANIMAIS._geral;
  const feitas = new Set();
  const falas = [];
  for (let n = 0; n < t.falas.length; n++) {
    const i = await escolher(app, animal.name, [`${c.name} entende o ${t.nome}.`, ...falas],
      t.falas.map((f, k) => ({ f, k })).filter(({ k }) => !feitas.has(k)).map(({ f, k }) => ({ rotulo: f[0], valor: k })));
    if (i == null) break;
    feitas.add(i);
    falas.push(`${t.falas[i][0]} — ${t.falas[i][1]}`);
  }
  if (falas.length) await app.mostrarTexto(animal.name, falas);
}

// ---------------------------------------- magias dentro da conversa ----

/** As magias que valem numa conversa agora: [{ h, s, v }] (v = variante ritual). */
export function magiasNaConversa(x, npc) {
  const out = [];
  for (const h of x.herois()) {
    if (!h.spellcasting) continue;
    for (const s of magiasForaDoHeroi(h)) {
      const u = UTIL[s.id];
      if (!u.dialogo) continue;
      if (u.alvo === 'criatura' && (!npc || npc.dead)) continue;
      // Falar com Animais só vale com um bicho na conversa.
      if (s.id === 'falarComAnimais' && !eAnimal(npc)) continue;
      out.push({ h, s });
    }
  }
  return out;
}

/**
 * O submenu "Conjurar" de uma conversa. Devolve as frases (para a página
 * seguinte da conversa) ou null se o jogador desistiu.
 */
export async function conjurarNaConversa(app, x, npc) {
  const cand = magiasNaConversa(x, npc);
  const itens = cand.map(({ h, s }) => {
    const pode = podeConjurarFora(h, s.id);
    return { rotulo: `${s.name}${s.id === 'aprimorarAtributo' ? ' (Esplendor da Águia)' : ''} — ${h.name}`, detalhe: detalheDeMagia(h, s), motivo: pode.ok ? null : pode.why, valor: { h, s } };
  });
  const r = await escolher(app, 'Conjurar', 'Quem conjura o quê? Gasta espaço de verdade e o tempo passa.', itens);
  if (!r) return null;
  const { h, s } = r;
  const u = UTIL[s.id];
  const opts = {};
  if (u.alvo === 'criatura') opts.alvo = npc;
  if (u.alvo === 'aliado') {
    const a = await escolher(app, s.name, 'Em quem?', x.herois().map((k) => ({ rotulo: k.name, valor: k })));
    if (!a) return null;
    opts.alvo = a;
  }
  if (u.escolhe === 'atributo') opts.opcao = 'aguia';
  const { r: res, texto } = lancar(x, h, s.id, opts);
  void res;
  return texto;
}
