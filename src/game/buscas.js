// UMA TENTATIVA POR HERÓI, em cada ponto.
//
// Procurar, escutar, espiar: num jogo de mesa isso custa tempo e o mestre
// corta a repetição ("não dá para tentar de novo sem que algo mude"). No
// clique não custa nada, e sem limite a CD some: o jogador aperta até o dado
// sair, e um fosso de Percepção CD 15 nunca pega ninguém com paciência.
//
// A regra, escolhida pelo dono: CADA HERÓI tenta UMA vez em cada ponto. Outro
// herói pode tentar — são outros olhos e outros ouvidos —, o mesmo não.
//
// O registro é um objeto simples, e não um `Set`, porque as cenas guardam o
// estado em `app.campanha` e ele precisa sobreviver a sair e voltar do lugar.
//
// Uso:
//   const buscas = criarBuscas(salvo.buscas ??= {});
//   ops.push({ ..., motivo: longe(5) ?? buscas.ja(c, 'escuta', tile),
//     fazer: () => { buscas.marcar(c, 'escuta', tile); ... } });

const chave = (c, tipo, onde) => `${c.id}:${tipo}:${onde ? `${onde.x},${onde.y}` : ''}`;

/**
 * @param {object} registro onde marcar (um objeto que a cena guarda)
 * @returns {{ ja: Function, marcar: Function, limpar: Function }}
 */
export function criarBuscas(registro) {
  return {
    /** O motivo para o menu, se este herói já tentou aqui; senão `null`. */
    ja: (c, tipo, onde = null) => (registro[chave(c, tipo, onde)] ? `${c.name} já tentou aqui` : null),
    /** Marca a tentativa. Chame ao FAZER, não ao mostrar. */
    marcar: (c, tipo, onde = null) => { registro[chave(c, tipo, onde)] = true; },
    /** Para quando a cena muda de verdade e o ponto volta a valer a pena. */
    limpar: (tipo) => {
      for (const k of Object.keys(registro)) if (k.includes(`:${tipo}:`)) delete registro[k];
    },
  };
}
