// O FECHO DA AVENTURA: a tela final, depois que a Caverna Onda Eco foi libertada.
//
// Segue a conclusão do livro e nada além dela (`TEXTOS.conclusao`, em `ondaeco-dados.js`): sem consequências inventadas e sem
// ganchos para outras aventuras. Aqui só entra o que a tela acrescenta: quem saiu vivo da mina. Sem efeito nas regras.

/** Quem tem o que mostrar ao fim: nome e nível de cada herói em pé. */
export function linhasDoGrupo(grupo = []) {
  return grupo.filter((h) => h && !h.dead && h.hp > 0 && h.level != null).map((h) => `${h.name}: nível ${h.level}`);
}

/** As páginas da tela final. `conclusao` é o fecho do livro (já com o destino de Nezznar e dos Buscapedra). */
export function paginasDoEpilogo({ conclusao, grupo }) {
  const herois = linhasDoGrupo(grupo);
  return [
    { titulo: 'A Mina Perdida', texto: conclusao },
    { titulo: 'Fim da aventura', texto: [herois.length ? `Quem saiu da Caverna Onda Eco: ${herois.join('; ')}.` : 'A mina guarda o nome de quem não voltou.'] },
  ];
}
