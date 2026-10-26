// HARNESS DE MEDIÇÃO DA CENA DE ÁRVORE TROVÃO, em Node.
//
// Roda a cena DE VERDADE (`game/capitulo4-arvoretrovao.js`) — gatilhos, luta,
// reforços, fim — com a interface trocada por stubs (`register.mjs` desvia
// `view/narrativa.js` e `view/nivel-tela.js`). Mede o que a cena faz, e não uma
// réplica dela. Uso:
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/cena-node/medir.mjs <bando> [N] [nivel]
//
// A LUZ É PREENCHIDA (`base.mjs` copia os dígitos de `mapa.luz` como o main.js): sem
// isso a medição sai no escuro e erra para os dois lados — já aconteceu.
// `jogador.mjs` é a política dos heróis: mira pelo CUSTO de caminho e não pela reta,
// e não ataca através de parede de borda.
// Base comum: monta o campo como o main.js (com luz), o grupo e os bandos como a cena.
const P = new URL('../../', import.meta.url).href;
export const G = await import(P + 'core/grid.js');
export const { Battlefield, distanceFt, ARESTA } = G;
export const { Encounter } = await import(P + 'rules/combat.js');
export const { makeParty } = await import(P + 'rules/party.js');
export const { makeMonster, MONSTERS } = await import(P + 'rules/monsters.js');
export const { takeMonsterTurn } = await import(P + 'rules/ai.js');
export const { makeRng } = await import(P + 'core/rng.js');
export const { hasCondition } = await import(P + 'rules/conditions.js');
export const Luz = await import(P + 'rules/luz.js');
export const { mapaDo } = await import(P + 'game/encounter.js');
export const { playCharacter } = await import(P + 'dev/balance.js');
export const { ARVORE_TROVAO, MAPA_ARVORE_TROVAO } = await import(P + 'game/arvoretrovao.js');
// ALVO=ondaEco: o mesmo harness mede a Caverna Onda Eco (`game/ondaeco.js`).
export const ONDA = process.env.ALVO === 'ondaEco';
export const { ONDA_ECO } = await import(P + 'game/ondaeco.js');
export const { passivePerception } = await import(P + 'rules/abilities.js');

export function montarCampo() {
  const mapa = mapaDo(ONDA ? 'ondaEco' : 'arvoreTrovao');
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length,
    mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
  if (mapa.luz) {
    field.luz = new Uint8Array(field.w * field.h);
    if (Array.isArray(mapa.luz)) {
      mapa.luz.forEach((linha, y) => { for (let x = 0; x < field.w; x++) field.luz[y * field.w + x] = Number(linha[x] ?? 0); });
    }
    field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
  }
  // a cena faz isto:
  const CH = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;
  field.folha = new Set(((ONDA ? ONDA_ECO : ARVORE_TROVAO).folhas ?? []).flatMap(([a, b]) => [CH(a, b), CH(b, a)]));
  return { mapa, field };
}
