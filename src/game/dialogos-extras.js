// O REGISTRO DAS FALAS POR PERFIL: opções e nós de conversa acrescentados POR NPC, sem mexer nas árvores das cenas.
//
// Cada grupo (`dialogos/*.js`) exporta um objeto: a chave é o NOME do NPC (como aparece na conversa) ou o `defId` dele,
// sem acento nem caixa; o valor é
//
//   {
//     nos:   { 'x:pedra': { fala: '...', opcoes: [...] } },     // nós novos (use o prefixo `x:` para não colidir com a árvore)
//     porNo: { oi: [ { texto, perfil, ... } ] },                  // opções acrescentadas a um nó que já existe na árvore
//   }
//
// As opções são as de `dialogo.js` (`vai`, `fim`, `teste`, `uma`, `efeito`, `requer`...) mais o campo `perfil` de
// `dialogo-perfil.js`. Elas só aparecem para quem tem a raça, a classe ou o atributo pedido.
import vila from './dialogos/vila.js';
import mansaoEEstrada from './dialogos/mansao-e-estrada.js';
import arvoreTrovaoEPoco from './dialogos/arvoretrovao-e-poco.js';
import ondaEco from './dialogos/ondaeco.js';

const chave = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const REGISTRO = new Map();
for (const grupo of [vila, mansaoEEstrada, arvoreTrovaoEPoco, ondaEco]) {
  for (const [nome, extra] of Object.entries(grupo)) {
    const k = chave(nome);
    const atual = REGISTRO.get(k) ?? { nos: {}, porNo: {} };
    Object.assign(atual.nos, extra.nos ?? {});
    for (const [no, ops] of Object.entries(extra.porNo ?? {})) (atual.porNo[no] ??= []).push(...ops);
    REGISTRO.set(k, atual);
  }
}

/** O que há de extra para a conversa com `npc` (por nome ou por `defId`). */
export function extrasDoNpc(npc) {
  const vazio = { nos: {}, porNo: {} };
  if (!npc) return vazio;
  let achado = null;
  for (const k of [npc.defId, npc.id, npc.name]) {
    const e = REGISTRO.get(chave(k));
    if (!e || e === achado) continue;
    if (!achado) { achado = e; continue; }
    const porNo = { ...achado.porNo };
    for (const [no, ops] of Object.entries(e.porNo)) porNo[no] = [...(porNo[no] ?? []), ...ops];
    achado = { nos: { ...achado.nos, ...e.nos }, porNo };
  }
  return achado ?? vazio;
}

/** Só para os testes: registra falas de um NPC inventado. */
export function registrarParaTeste(nome, extra) {
  const k = chave(nome);
  const atual = REGISTRO.get(k) ?? { nos: {}, porNo: {} };
  Object.assign(atual.nos, extra.nos ?? {});
  for (const [no, ops] of Object.entries(extra.porNo ?? {})) atual.porNo[no] = [...(atual.porNo[no] ?? []), ...ops];
  REGISTRO.set(k, atual);
}

/** Só para os testes: o registro inteiro (chave normalizada → { nos, porNo }). */
export const REGISTRO_PARA_TESTE = () => REGISTRO;

/** Só para os testes: apaga as falas registradas de um NPC inventado. */
export const limparParaTeste = (nome) => REGISTRO.delete(chave(nome));

/** Os nomes que têm falas por perfil (para os testes). */
export const NPCS_COM_EXTRAS = () => [...REGISTRO.keys()];
