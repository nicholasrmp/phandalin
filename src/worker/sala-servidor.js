// O protocolo da sala do lado do servidor, sem rede: o que fazer com UMA mensagem
// que chegou de um navegador. O Durable Object (`sala-do.js`) só guarda o estado,
// entrega o texto bruto aqui e manda de volta o que esta função mandar.
//
// Ficar em Node-testável é o ponto: `cloudflare:workers` não carrega fora do
// Worker, e a regra de "o que vale" não pode depender dele.
//
// Mensagens do navegador (JSON, no máximo `MAX_BYTES` bytes):
//   { tipo: 'criar', eu, nome, persona?, maxJogadores?, origem? }  a primeira de quem abre a sala
//   { tipo: 'entrar', eu, nome, persona? }                         a primeira de quem chega, ou volta
//   { tipo: 'mover', x, y }  { tipo: 'persona', heroi }            andar pela taverna, trocar de figura
//   { tipo: 'emote', id }                                          uma frase pronta em balão (T-14)
//   { tipo: 'ping' }                                     o batimento: a conexão ainda vive?
//   e as intenções de `game/sala.js` (pegar, largar, pronto, iniciar, ...)
// `eu` é o id SECRETO do jogador. Vai na primeira mensagem e não na URL: a URL
// aparece nos registros do Cloudflare (`observability`), o corpo não.
// Mensagens do servidor:
//   { tipo: 'sala', visao }   o estado inteiro, depois de toda mudança
//   { tipo: 'erro', erro }    a intenção foi recusada; o estado não mudou
//   { tipo: 'pong' }          resposta ao ping
//   { tipo: 'fechada' }       a sala acabou

import { criarSala, aplicar, visaoDaSala, idValido } from '../game/sala.js';
import { MAX_VISTA, MS_ENTRE_VISTAS, lerVista } from '../game/partida-vista.js';

export const MAX_BYTES = 2048;

/** Quantas mensagens um jogador pode mandar por janela: sobra para clicar rápido, falta para inundar. */
export const LIMITE_POR_JANELA = 30;
export const JANELA_MS = 10_000;

/** Quantas conexões abertas uma sala aceita, e quantas por jogador (várias abas do mesmo navegador). */
export const MAX_CONEXOES_POR_SALA = 12;
export const MAX_CONEXOES_POR_JOGADOR = 3;

export const erro = (texto) => ({ tipo: 'erro', erro: texto });

const tamanho = (texto) => new TextEncoder().encode(texto).length;

/** Lê o JSON de uma mensagem; `null` se não for um objeto com `tipo`. */
function lerMensagem(bruto) {
  if (typeof bruto !== 'string' || tamanho(bruto) > MAX_BYTES) return null;
  try {
    const m = JSON.parse(bruto);
    return m && typeof m === 'object' && !Array.isArray(m) && typeof m.tipo === 'string' ? m : null;
  } catch { return null; }
}

/**
 * Quem está falando, na PRIMEIRA mensagem de uma conexão: o campo `eu`. `null` se
 * a mensagem não traz um id válido (a conexão continua sem identidade).
 */
export function identidade(bruto) {
  const m = lerMensagem(bruto);
  return m && idValido(m.eu) ? m.eu : null;
}

/**
 * Trata uma mensagem. `sala` é o estado atual (ou `null` se a sala ainda não foi
 * criada). `outrasConexoes` é quantas OUTRAS conexões abertas o mesmo jogador tem
 * (outra aba). Devolve `{ sala, resposta, mudou, removido, saiu }`:
 *   sala      o estado depois (o mesmo objeto, mutado, ou o recém-criado)
 *   resposta  o que mandar SÓ a quem escreveu, ou `null`
 *   mudou     o estado mudou: guardar e retransmitir a visão a todos
 *   removido  o id secreto de quem acabou de ser removido: derrubar as conexões dele
 *   saiu      o id secreto de quem saiu por conta própria: fechar as conexões dele
 *   soEsta    "sair" de uma aba quando há outra aberta: só esta conexão fecha, o jogador fica
 */
export function tratarMensagem({ sala, jogadorId, bruto, codigo, agora, outrasConexoes = 0 }) {
  if (typeof bruto !== 'string') return { sala, resposta: erro('mensagem inválida'), mudou: false };
  if (tamanho(bruto) > MAX_BYTES) return { sala, resposta: erro('mensagem grande demais'), mudou: false };
  const msg = lerMensagem(bruto);
  if (!msg) return { sala, resposta: erro('mensagem inválida'), mudou: false };

  if (msg.tipo === 'ping') return { sala, resposta: { tipo: 'pong' }, mudou: false };

  if (msg.tipo === 'criar') {
    if (sala) {
      // O anfitrião que repete o `criar` (a conexão caiu antes de ele ver a resposta) só volta para a sala.
      if (sala.anfitriao === jogadorId) return tratarMensagem({ sala, jogadorId, bruto: JSON.stringify({ tipo: 'entrar', nome: msg.nome, persona: msg.persona }), codigo, agora, outrasConexoes });
      return { sala, resposta: erro('essa sala já existe: entre com o código'), mudou: false };
    }
    const r = criarSala({ codigo, anfitriao: jogadorId, nome: msg.nome, maxJogadores: msg.maxJogadores ?? 4, origem: msg.origem, persona: msg.persona, agora });
    if (!r.ok) return { sala: null, resposta: erro(r.erro), mudou: false };
    return { sala: r.sala, resposta: null, mudou: true };
  }

  if (!sala) return { sala, resposta: erro('essa sala não existe'), mudou: false };

  // Fechar uma aba não pode expulsar o jogador da outra: só a última conexão sai de verdade.
  if (msg.tipo === 'sair' && outrasConexoes > 0) return { sala, resposta: null, mudou: false, soEsta: true };

  const r = aplicar(sala, jogadorId, msg, agora);
  if (!r.ok) return { sala, resposta: erro(r.erro), mudou: false };
  return { sala, resposta: null, mudou: !r.igual, tipo: msg.tipo, removido: r.removido ?? null, saiu: r.saiu ?? null, repassar: r.repassar ?? null, repassarA: r.repassarA ?? null };
}

/** Janela deslizante: `true` se esta mensagem passa. `registro` é uma lista de instantes. */
export function dentroDoLimite(registro, agora) {
  while (registro.length && agora - registro[0] > JANELA_MS) registro.shift();
  if (registro.length >= LIMITE_POR_JANELA) return false;
  registro.push(agora);
  return true;
}

/**
 * F4: o anfitrião publica a VISTA da partida (`game/partida-vista.js`) e o servidor só a repassa. Não é
 * uma mensagem comum: passa de 2 KB (o teto das outras), então tem a sua porta, com as suas regras.
 *   - só o anfitrião, e só com a partida iniciada;
 *   - até `MAX_VISTA` caracteres, e uma a cada `MS_ENTRE_VISTAS`;
 *   - tem de ser uma vista de verdade (versão, mapa por nome, combatentes com id e casa).
 * `ultimaEm` é o instante da última vista aceita. Devolve `{ ok }` ou `{ ok: false, erro, calado }`
 * (`calado`: não vale responder, é só excesso de ritmo).
 */
export function tratarVista({ sala, jogadorId, bruto, agora, ultimaEm = 0 }) {
  if (!sala || sala.fase !== 'iniciada') return { ok: false, erro: 'a partida não está em andamento' };
  if (sala.anfitriao !== jogadorId) return { ok: false, erro: 'só o anfitrião publica a partida' };
  if (typeof bruto !== 'string' || bruto.length > MAX_VISTA + 200) return { ok: false, erro: 'a vista da partida é grande demais' };
  if (agora - ultimaEm < MS_ENTRE_VISTAS) return { ok: false, erro: 'devagar', calado: true };
  let m;
  try { m = JSON.parse(bruto); } catch { return { ok: false, erro: 'vista inválida' }; }
  if (!m || m.tipo !== 'partida' || !lerVista(m.vista)) return { ok: false, erro: 'vista inválida' };
  return { ok: true, texto: JSON.stringify({ tipo: 'partida', vista: m.vista }) };
}

/** É uma mensagem de vista? (Olha só o começo, sem ler o resto: ela é grande.) */
export const ehVista = (bruto) => typeof bruto === 'string' && /^\s*\{\s*"tipo"\s*:\s*"partida"/.test(bruto.slice(0, 40));

/** É uma narrativa do anfitrião? Também passa por porta própria (maior que 2 KB: páginas de texto). */
export const ehNarrativa = (bruto) => typeof bruto === 'string' && /^\s*\{\s*"tipo"\s*:\s*"narrativa"/.test(bruto.slice(0, 40));
export const MAX_NARRATIVA = 60_000;

/**
 * F4.3: o anfitrião transmite a narrativa (A-02, `game/porta-narrativa.js`): `{ tipo: 'narrativa', msg }`, com
 * `msg` sendo `{ tipo: 'abrir', id, pedido }` ou `{ tipo: 'fechar', id, indice }`. Só o anfitrião, com a partida
 * iniciada; o servidor confere a forma e repassa a todos os outros.
 */
export function tratarNarrativa({ sala, jogadorId, bruto }) {
  if (!sala || sala.fase !== 'iniciada') return { ok: false, erro: 'a partida não está em andamento' };
  if (sala.anfitriao !== jogadorId) return { ok: false, erro: 'só o anfitrião conta a narrativa' };
  if (typeof bruto !== 'string' || bruto.length > MAX_NARRATIVA) return { ok: false, erro: 'a narrativa é grande demais' };
  let m;
  try { m = JSON.parse(bruto); } catch { return { ok: false, erro: 'narrativa inválida' }; }
  const msg = m?.msg;
  if (!msg || !['abrir', 'fechar'].includes(msg.tipo) || !Number.isInteger(msg.id)) return { ok: false, erro: 'narrativa inválida' };
  if (msg.tipo === 'abrir' && (!msg.pedido || !Array.isArray(msg.pedido.paginas))) return { ok: false, erro: 'narrativa inválida' };
  return { ok: true, texto: JSON.stringify({ tipo: 'narrativa', msg }) };
}

/**
 * F6: o anfitrião manda o SAVE da cena em que está (o autosave de entrada de cena, `game/save.js`), e o servidor o guarda: se o
 * anfitrião cair, quem assumir retoma dele. `{ tipo: 'salvar', save }`. Só o anfitrião, com a partida iniciada, até `MAX_SAVE`.
 * O servidor não interpreta o save (quem o abre valida e migra); só confere que tem a cara de um.
 */
export const ehSave = (bruto) => typeof bruto === 'string' && /^\s*\{\s*"tipo"\s*:\s*"salvar"/.test(bruto.slice(0, 40));
export const MAX_SAVE = 400_000;
export function tratarSave({ sala, jogadorId, bruto }) {
  if (!sala || sala.fase !== 'iniciada') return { ok: false, erro: 'a partida não está em andamento' };
  if (sala.anfitriao !== jogadorId) return { ok: false, erro: 'só o anfitrião guarda o jogo da sala' };
  if (typeof bruto !== 'string' || bruto.length > MAX_SAVE) return { ok: false, erro: 'o save é grande demais' };
  let m;
  try { m = JSON.parse(bruto); } catch { return { ok: false, erro: 'save inválido' }; }
  const s = m?.save;
  if (!s || typeof s !== 'object' || Array.isArray(s.herois) !== true || !s.herois.length || typeof s.config !== 'object') return { ok: false, erro: 'save inválido' };
  return { ok: true, texto: JSON.stringify(s) };
}

/** A mensagem de visão que um jogador recebe (cada um recebe a SUA, com o `voce` dele). */
export const mensagemDeSala = (sala, jogadorId) => ({ tipo: 'sala', visao: visaoDaSala(sala, jogadorId) });
