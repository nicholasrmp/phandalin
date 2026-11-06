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
const { montarCampo: montarCampoDoJogo } = await import(P + 'game/campo.js');
export const { passivePerception } = await import(P + 'rules/abilities.js');

export function montarCampo() {
  // O MESMO `montarCampo` DO JOGO. Isto aqui montava o `Battlefield` na mão, com terreno, altura, objetos e
  // `paredes`, e remendava `field.folha` por fora. Funcionava enquanto a planta era desenhada à mão; desde
  // que a cena passou a rodar sobre o battlemap da Forgotten Adventures, a parede vem em TRAÇO
  // (`tracos`/`tracosTipo`) e a barricada do culto é REGIÃO — e nada disso chegava ao campo deste harness,
  // que media então um mapa sem parede e sem região. Delegar é a correção, e de quebra traz luz, névoa,
  // sobreposições e folhas sem remendo.
  const mapa = mapaDo(ONDA ? 'ondaEco' : 'arvoreTrovao');
  return { mapa, field: montarCampoDoJogo(mapa) };
}
