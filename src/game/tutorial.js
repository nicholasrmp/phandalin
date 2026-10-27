// O TUTORIAL CONTEXTUAL: dicas curtas que aparecem na hora em que fazem sentido (como no Solasta), uma vez cada, e podem ser
// desligadas. Puro: roda em Node. A tela é `view/dicas.js`; quem dispara os gatilhos é `main.js` (`dicar`).
//
// Um GATILHO é um acontecimento do jogo ('combate', 'golpe', 'magia', 'queda'); cada um chama uma ou mais dicas, em ordem.

export const DICAS = {
  combate: {
    titulo: 'Começa a luta',
    texto: ['O combate é por turnos: primeiro age o seu grupo (todos os heróis, na ordem que você quiser), depois os inimigos.',
      'Cada herói tem **Movimento**, uma **Ação**, uma **Ação bônus** e uma **Reação** por rodada. Eles aparecem no canto de baixo à direita.'],
  },
  acoes: {
    titulo: 'Mover e atacar',
    texto: ['Clique num quadrado **azul** para andar. Clique num **inimigo** para atacar com a arma na mão.',
      'Com o **botão direito** em qualquer casa você vê o que dá para fazer e a **chance de acertar**. Quando terminar, **Terminar turno** (ou a barra de espaço).'],
  },
  golpe: {
    titulo: 'Como um ataque funciona',
    texto: ['Rola-se um d20 e soma-se o bônus do herói: se passar a **Classe de Armadura** do alvo (CA), acerta. O 20 natural é **crítico** (dano em dobro); o 1 natural sempre erra.',
      'O **Registro** guarda cada rolagem e o porquê de cada resultado.'],
  },
  magia: {
    titulo: 'Magias e espaços',
    texto: ['Truques são grátis e ilimitados. As outras magias gastam um **espaço de magia** (os losangos ◆ ao lado do herói), que volta num **descanso longo**.',
      'Algumas pedem **concentração**: sofrer dano pode quebrá-la, e conjurar outra magia de concentração encerra a primeira.'],
  },
  queda: {
    titulo: 'Um herói caiu',
    texto: ['A 0 pontos de vida o herói fica **caído** e faz testes contra a morte a cada turno dele: três sucessos o estabilizam, três falhas o matam.',
      'Um aliado pode **estabilizar** (ação) ou **curar** o herói, que levanta com essa vida. Dano em quem já está caído conta como falha.'],
  },
};

/** Que dicas cada gatilho chama, em ordem. */
export const GATILHOS = {
  combate: ['combate', 'acoes'],
  golpe: ['golpe'],
  magia: ['magia'],
  queda: ['queda'],
};

/** As dicas a mostrar agora para `gatilho`: as que ainda não foram vistas (`vistas` é um Set de ids). Vazio se as dicas estão desligadas. */
export function dicasDoGatilho(gatilho, vistas, { ligado = true } = {}) {
  if (!ligado) return [];
  return (GATILHOS[gatilho] ?? []).filter((id) => DICAS[id] && !vistas.has(id)).map((id) => ({ id, ...DICAS[id] }));
}

const CHAVE = 'phandalin:dicas';

/** O que este navegador já viu: `{ vistas: Set, ligado }`. */
export function lerDicas(storage) {
  try {
    const d = JSON.parse(storage.getItem(CHAVE) ?? 'null');
    return { vistas: new Set(Array.isArray(d?.vistas) ? d.vistas : []), ligado: d?.ligado !== false };
  } catch { return { vistas: new Set(), ligado: true }; }
}

export function guardarDicas(storage, { vistas, ligado }) {
  try { storage.setItem(CHAVE, JSON.stringify({ vistas: [...vistas], ligado })); } catch { /* sem armazém: mostra de novo na próxima vez */ }
}
