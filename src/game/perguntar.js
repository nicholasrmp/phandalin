// O LADO DO NAVEGADOR de "perguntar qualquer coisa": olha o banco que veio com o jogo e, se não achar, pergunta ao
// servidor (`src/dev/servidor-dialogo.mjs`). Sem servidor, como no jogo publicado, responde com o banco e as falas
// escritas à mão: o jogo não depende de API nenhuma para funcionar.
import { FICHAS, idDaFicha, fatosLiberados } from './npc-saber.js';
import { bancoVazio, buscarNoBanco, guardarNoBanco, responderSemModelo, perguntaDeManobra, MAX_MEMORIA, MAX_PERGUNTA, MAX_FALA } from './dialogo-ia.js';
import { assuntoDe, normal } from './perguntas.js';
import { estagioDoObelisco } from './npc-saber-comum.js';

export const podePerguntar = (npc) => Boolean(idDaFicha(npc));

/** As falas de memória que funcionam sem modelo, por NPC. */
let vozes = null;
async function asVozes() {
  if (vozes) return vozes;
  try {
    const r = await fetch('/dialogos/vozes.json');
    vozes = r.ok ? await r.json() : {};
  } catch {
    vozes = {};
  }
  return vozes;
}

/** Em `npm run dev`, cada pergunta vai para o caderno de `dev/relatorio-dialogos.mjs`. Na publicação nada disso existe. */
function anotar(npc, pergunta, resposta, memoria) {
  if (!import.meta.env?.DEV) return;
  fetch('/api/dialogo-registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ npc, pergunta, origem: resposta.origem, tipo: resposta.tipo, fatos: resposta.fatos ?? [], fala: resposta.fala, memoria }),
  }).catch(() => {});
}

const PEDE_LEMBRANCA = /\b(o que|do que|de que|de onde|onde) (eu )?(te |lhe )?(disse|falei|contei|perguntei|estava (procurando|falando)|que eu)\b|\b(lembra|lembras|voce lembra|se lembra|ainda lembra)\b|\b(ja te (disse|falei|contei|perguntei)|eu te (disse|falei|contei))\b/;
const sortear = (lista, chave) => lista[[...String(chave)].reduce((a, c) => a + c.charCodeAt(0), 0) % lista.length];

/**
 * A MEMÓRIA SEM MODELO: não é lembrar de verdade, é reagir ao que a campanha guardou. Pergunta sobre o que foi dito cita a última frase do
 * jogador; pergunta repetida ouve que já foi respondida; e quem volta a falar com ele ganha uma abertura. As falas são só forma, sem fato.
 */
export function responderComLembranca(voz, pergunta, completa, memoria) {
  if (!voz) return null;
  if (PEDE_LEMBRANCA.test(normal(pergunta))) {
    const ultima = memoria.at(-1);
    return ultima
      ? { tipo: 'nao_sabe', fala: sortear(voz.lembra, pergunta).replace('{frase}', ultima.p.slice(0, 80)), fatos: [], origem: 'lembranca', trava: true }
      : { tipo: 'nao_sabe', fala: sortear(voz.naoLembra, pergunta), fatos: [], origem: 'lembranca', trava: true };
  }
  if (memoria.some((m) => normal(m.p) === normal(completa))) return { tipo: 'nao_sabe', fala: sortear(voz.repete, pergunta), fatos: [], origem: 'lembranca', trava: true };
  return null;
}

let banco = null;
async function oBanco() {
  if (banco) return banco;
  try {
    const r = await fetch('/dialogos/banco.json');
    banco = r.ok ? await r.json() : bancoVazio();
  } catch {
    banco = bancoVazio();
  }
  return banco;
}

/** O que a cena permite agora: as flags da campanha e as magias de pé. */
export const estadoDoSaber = (ctx) => ({
  ...ctx.app?.campanha?.vila?.feito,
  ...ctx.app?.campanha?.feitos,
  ...ctx.flags,
  zona: Boolean(ctx.zona?.()),
  mapaAchado: Boolean(ctx.app?.campanha?.castelo?.mapa),
  // O OBELISCO (capítulos 5 a 8): o capítulo em que a vila está e os marcos dele, para os fatos das fichas do Obelisco
  // (`npc-saber-obelisco-*.js`) esperarem a hora certa. Os ramos da campanha vão junto, para o fato que pergunta por uma cena.
  ...estadoDoObelisco(ctx.app?.campanha),
});

/** O pedaço do estado do saber que vem do Obelisco. */
export function estadoDoObelisco(camp) {
  return {
    estagio: estagioDoObelisco(camp),
    refracaoVencida: Boolean(camp?.obelisco8?.feito?.refracaoVencida),
    portalAberto: Boolean(camp?.obelisco7?.portalAberto),
    marco9: Boolean(camp?.obelisco6?.marco9),
    pagoFim: Boolean(camp?.obelisco5?.feito?.pagoFim),
    o5: camp?.obelisco5 ?? {}, o6: camp?.obelisco6 ?? {}, o7: camp?.obelisco7 ?? {}, o8: camp?.obelisco8 ?? {},
  };
}

/** O NPC se cansa: uma conversa não é um interrogatório sem fim, e cada pergunta com memória custa uma chamada. */
export const MAX_PERGUNTAS_POR_CONVERSA = 15;
/** Quantas recusas sobre o mesmo assunto, na mesma situação, até ele parar de considerar a pergunta. */
const RECUSAS_ATE_CALAR = 2;

/** O que o NPC lembra, guardado na campanha (vai no save). */
export function memoriaDoNpc(app, npc) {
  const id = idDaFicha(npc);
  const todas = (app.campanha ??= {}).memoriaDosNpcs ??= {};
  return (todas[id] ??= []);
}

/**
 * O que pode voltar ao modelo: o que ele disse com um fato que não vale mais (a gangue caiu, o favor foi pago) sai, para a memória não
 * sustentar um mundo que já mudou nem devolver o que a cena tornou a esconder.
 */
export const memoriaValida = (memoria, liberados) => memoria.filter((m) => (m.fatos ?? []).every((f) => liberados.includes(f)));

/** Já recusou isto, na mesma situação? Insistir não muda nada, e não vale gastar uma chamada para ouvir o não de novo. */
function jaRecusou(memoria, assunto, liberados) {
  if (!assunto) return false;
  return memoria.filter((m) => m.tipo === 'recusa' && m.assunto === assunto && m.n === liberados.length).length >= RECUSAS_ATE_CALAR;
}

/** Guarda a troca, se ela merece lembrança. Fala fora do tema e as respostas das travas não entram: não há por que repeti-las ao modelo. */
export function lembrar(memoria, pergunta, resposta, liberados) {
  if (!['responde', 'recusa', 'nao_sabe'].includes(resposta.tipo) || resposta.trava) return;
  memoria.push({ p: String(pergunta).slice(0, MAX_PERGUNTA), f: String(resposta.fala).slice(0, MAX_FALA), tipo: resposta.tipo, fatos: resposta.fatos ?? [], assunto: assuntoDe(pergunta)?.id ?? null, n: liberados.length });
  memoria.splice(0, Math.max(0, memoria.length - MAX_MEMORIA));
}

/**
 * A resposta do NPC: `{ fala, tipo, fatos, origem }`. Nunca rejeita.
 *
 * AS TRAVAS, nesta ordem: manobra e cansaço não chegam ao modelo; recusa repetida também não; os fatos seguem na lista fechada, e o que o
 * dado ainda não liberou nem é enviado, então amolecer o modelo não tem o que arrancar dele; e a resposta passa por `conferir`.
 * `completa` é a pergunta com o assunto anterior, para o banco, que não tem memória. `perguntasNaConversa` conta as desta conversa.
 */
export async function perguntarAoNpc(npc, pergunta, estado, opcoes = {}) {
  const resposta = await responder(npc, pergunta, estado, opcoes);
  anotar(idDaFicha(npc), opcoes.completa ?? pergunta, resposta, (opcoes.memoria ?? []).length);
  return resposta;
}

async function responder(npc, pergunta, estado, { evitar = [], memoria = [], completa = pergunta, perguntasNaConversa = 0 } = {}) {
  const id = idDaFicha(npc);
  const ficha = FICHAS[id];
  const liberados = fatosLiberados(ficha, estado);
  if (perguntaDeManobra(pergunta)) return { tipo: 'fora_do_tema', fala: ficha.foraDoTema, fatos: [], origem: 'trava', trava: true };
  if (perguntasNaConversa >= MAX_PERGUNTAS_POR_CONVERSA) return { tipo: 'recusa', fala: ficha.naoConta, fatos: [], origem: 'trava', trava: true };
  const valida = memoriaValida(memoria, liberados);
  if (jaRecusou(valida, assuntoDe(completa)?.id ?? null, liberados)) return { tipo: 'recusa', fala: ficha.naoConta, fatos: [], origem: 'trava', trava: true };

  const b = await oBanco();
  // Sem nada para lembrar a fala é reaproveitável. Com memória, quem responde é o modelo; o banco fica para quando ele não existir.
  if (!valida.length) {
    const salva = buscarNoBanco(b, id, ficha, liberados, completa, { evitar });
    if (salva) return { ...salva, origem: 'banco' };
  }
  try {
    const r = await fetch('/api/dialogo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npc: id, pergunta: valida.length ? pergunta : completa, liberados, evitar: evitar.slice(-12), memoria: valida.map((m) => ({ p: m.p, f: m.f })) }),
    });
    if (r.ok) {
      const resposta = await r.json();
      if (resposta.origem === 'modelo' && !valida.length) guardarNoBanco(b, id, ficha, liberados, completa, resposta, 'modelo');
      if (resposta.origem !== 'reserva') return resposta;
    }
  } catch { /* sem servidor: segue sem modelo */ }
  // Sem modelo: primeiro o que a lembrança resolve, depois a fala guardada, que não vem já dita, e por fim a escrita à mão.
  const voz = (await asVozes())[id];
  const lembranca = responderComLembranca(voz, pergunta, completa, valida);
  if (lembranca) return lembranca;
  const abertura = valida.length && perguntasNaConversa === 0 && voz ? `${sortear(voz.voltou, pergunta)} ` : '';
  const comAbertura = (r, origem) => ({ ...r, fala: `${abertura}${r.fala}`, origem });
  const exata = buscarNoBanco(b, id, ficha, liberados, completa, { evitar });
  if (exata) return comAbertura(exata, 'banco');
  const guardada = buscarNoBanco(b, id, ficha, liberados, completa, { evitar, semModelo: true });
  if (guardada) return comAbertura(guardada, 'banco');
  return comAbertura(responderSemModelo(ficha, liberados, completa), 'reserva');
}
