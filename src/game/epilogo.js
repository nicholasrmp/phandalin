// O FECHO DA AVENTURA: o que a vila fica sabendo depois que a Caverna Onda Eco foi libertada.
//
// A conclusão do livro é curta (a mina restaurada, Gundren e Nundro, a parte dos lucros). Aqui ela ganha as consequências
// do que o grupo fez ao longo da campanha: cada linha só entra se o grupo fez aquilo (`camp.feitos`), e o texto é nosso.
// Sem efeito nas regras: é só leitura do estado; quem decide o que mostrar é a cena da Onda Eco (`capitulo5-ondaeco.js`).

/** As linhas de "o que ficou para trás", em ordem de história. Vazio se o grupo quase não fez nada além da mina. */
export function linhasDoEpilogo(feitos = {}) {
  const f = feitos;
  const l = [];
  if (f.cajavidro) l.push('Com o Cajavidro fora de cena, os Marcarrubra se desfizeram e Phandalin voltou a respirar.');
  if (f.grolMorto) l.push('O Rei Grol morreu no próprio castelo, e o Castelo Dentefino ficou sem rei.');
  else if (f.casteloDentefino) l.push('O Castelo Dentefino deixou de ser o ninho dos goblins do Rei Grol.');
  if (f.gundrenResgatado) l.push('Gundren Buscapedra saiu vivo do castelo e já pergunta quando se pode voltar à mina.');
  if (f.cumeLimpo) l.push('O bando de orcs do Cume da Wyvern se dispersou, e a Trilha Triboar respira um pouco.');
  if (f.kostDerrotado) l.push('O Mago Vermelho do Poço da Coruja Velha deixou de ser uma ameaça para a região.');
  if (f.expulsouODragao) l.push('Presa Peçonhenta, o dragão verde de Árvore Trovão, foi expulso. Dragão não esquece, e a região sabe que ele pode voltar.');
  else if (f.dragaoDeArvoreTrovao) l.push('O dragão verde de Árvore Trovão caiu, e Phandalin fala disso até hoje.');
  if (f.acordoComODragao) l.push('O acordo com o dragão de Árvore Trovão pesa na consciência de quem o fez, e ainda vai cobrar.');
  if (f.aliadoDoCulto) l.push('O culto da Árvore Trovão jurou lealdade ao grupo e morreu na torre, ao lado do dragão. Foi a última palavra dele.');
  if (f.agathaGrimorio || f.agathaTorre || f.sabeOCastelo) l.push('A banshee de Conyberry respondeu ao que lhe perguntaram e não quis mais conversa.');
  if (f.nundroResgatado) l.push('Nundro Buscapedra, salvo dos interrogatórios do Aranha Negra, agradeceu abatido e perguntou pelo irmão.');
  return l;
}

/** Quem tem o que mostrar ao fim: nome e nível de cada herói em pé. */
export function linhasDoGrupo(grupo = []) {
  return grupo.filter((h) => h && !h.dead && h.hp > 0 && h.level != null).map((h) => `${h.name}: nível ${h.level}`);
}

/** As páginas da tela final, na ordem em que o jogador as lê. `conclusao` é o fecho do livro (já com o destino de Nezznar). */
export function paginasDoEpilogo({ conclusao, feitos, grupo }) {
  const paginas = [{ titulo: 'A Mina Perdida', texto: conclusao }];
  const rastro = linhasDoEpilogo(feitos);
  if (rastro.length) paginas.push({ titulo: 'O que ficou para trás', texto: rastro });
  const herois = linhasDoGrupo(grupo);
  paginas.push({
    titulo: 'Fim da aventura',
    texto: [
      herois.length ? `Quem saiu da Caverna Onda Eco: ${herois.join('; ')}.` : 'A mina guarda o nome de quem não voltou.',
      'A região continua aberta. Há estradas sem andar e histórias sem fim, mas a Mina Perdida de Phandelver, essa, voltou a ser achada.',
    ],
  });
  return paginas;
}
