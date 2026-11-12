// OS VENENOS DO LIVRO DO MESTRE. O número é do livro (a CD de Constituição, o dano, o tempo); o texto é nosso.
//
// O livro separa o veneno pelo jeito de chegar ao corpo, e é isso que decide se ele entra aqui:
//   FERIDA  (`untar`)   passa-se na lâmina da mão; o próximo acerto de corte ou ponta, dentro de um minuto, o leva;
//   INALAR  (`soprar`)  sopra-se o pó na cara de quem está encostado (o cubo de 1,5 m do livro é a casa dele).
// O de CONTATO (o muco de rastejador carniceiro, o óleo de taggit) e o de ENGOLIR (o sangue de assassino, as lágrimas da
// meia-noite, a tintura pálida, o torpor, o soro da verdade) ficam de fora: o jogo não tem o gesto de pôr veneno numa
// maçaneta nem num copo, e a regra não aceita o de contato na lâmina. O de inalar que se repete a cada turno (a fumaça
// de othur queimado) também, por enquanto.
//
// A regra de aplicar é `combat.js aplicarVeneno`: falhou, o dano e as condições; passou, metade se `metade`.
const veneno = (id, name, custo, desc, efeito, jeito) => ({
  id, name, tipo: 'poção', art: 'fogo', pilha: true, peso: 0, custo, fonte: 'dmg', desc,
  consumivel: jeito, veneno: efeito, acao: 'acao',
});
const H = 600; // uma hora, em rodadas

export const VENENOS = {
  venenoDeSerpente: veneno('venenoDeSerpente', 'Veneno de serpente', 200,
    'Tirado de uma cobra venenosa gigante. Na lâmina: quem leva o golpe faz Constituição CD 11; falha, 3d6 de veneno; passa, metade.',
    { cd: 11, dano: '3d6', metade: true }, 'untar'),
  venenoDrow: veneno('venenoDrow', 'Veneno drow', 200,
    'Feito longe da luz do sol. Na lâmina: Constituição CD 13 ou envenenado por uma hora; quem falha por 5 ou mais também desmaia enquanto durar (o dano acorda).',
    { cd: 13, condicoes: [{ id: 'envenenado', rodadas: H }], desmaiaPor: 5 }, 'untar'),
  venenoDeSerpe: veneno('venenoDeSerpe', 'Veneno de wyvern', 1200,
    'Tirado do ferrão da cauda de uma wyvern morta. Na lâmina: Constituição CD 15; falha, 7d6 de veneno; passa, metade.',
    { cd: 15, dano: '7d6', metade: true }, 'untar'),
  venenoDeVermePurpura: veneno('venenoDeVermePurpura', 'Veneno de verme púrpura', 2000,
    'Do ferrão de um verme púrpura. Na lâmina: Constituição CD 19; falha, 12d6 de veneno; passa, metade.',
    { cd: 19, dano: '12d6', metade: true }, 'untar'),
  malicia: veneno('malicia', 'Malícia', 250,
    'Um pó para soprar na cara de quem está perto: Constituição CD 15 ou envenenado e cego por uma hora.',
    { cd: 15, condicoes: [{ id: 'envenenado', rodadas: H }, { id: 'cego', rodadas: H }] }, 'soprar'),
  essenciaDeEter: veneno('essenciaDeEter', 'Essência de éter', 300,
    'Um pó para soprar na cara de quem está perto: Constituição CD 15 ou envenenado e desmaiado por oito horas (o dano acorda).',
    { cd: 15, condicoes: [{ id: 'envenenado', rodadas: 8 * H }, { id: 'desmaiadoDeVeneno', rodadas: 8 * H }] }, 'soprar'),
};
