// O VOCABULÁRIO DOS TIPOS DE DANO, num lugar só.
//
// Este arquivo existe por causa de um defeito que custou METADE da Fúria do
// bárbaro. A condição resistia a 'contundente'; toda arma do jogo causa
// 'concussão'. A comparação em `combat.js` é de string crua
// (`def.resiste?.includes(type)`), então a resistência simplesmente não
// disparava — sem erro, sem aviso no console, sem nada na tela. O jogador via
// o bárbaro em Fúria tomar dano inteiro de maça, clava, martelo e da clava do
// ogro, e não tinha como saber que era defeito.
//
// E era o mesmo par partido nos DOIS sentidos: a Chifrada da cabra gigante e a
// Muralha de Vento causavam 'contundente', e por isso não acionavam a
// vulnerabilidade a concussão do esqueleto — a única do elenco, que existe para
// dar ao clérigo o momento em que a maça é a arma certa. (O espectro e o wraith
// NÃO entram nessa conta: a resistência deles é só contra dano não mágico, e a
// Muralha é magia. Medi, e são 12 de 12.) Seis quedas — o fosso da trilha, a
// chaminé, o desabamento, quem perde o voo — causavam 'contundente' e passavam
// por cima de qualquer resistência.
//
// 'concussão' é a grafia certa, e não por gosto: é a palavra que o jogo mostra
// ao jogador na ficha e na loja, ao lado do dado de dano (`view/ficha.js`,
// `view/loja.js`). Um texto de característica que diz "contundente" manda o
// jogador procurar um tipo de dano que a tela dele nunca escreve.
//
// QUEM LÊ ESTA LISTA: `monsters.js` (os três físicos), `conditions.js` (a
// Fúria) e, sobretudo, o TESTE em `src/dev/testes-regras.mjs`. Ele varre todo
// tipo que alguma arma, ficha, magia ou cena CAUSA e todo tipo que alguma
// ficha ou condição RESISTE, e falha quando aparece grafia que não está aqui.
// É a única defesa possível contra um erro que não faz barulho.

export const TIPOS_DE_DANO = Object.freeze([
  // Físicos: o que arma e garra causam.
  'cortante', 'perfurante', 'concussão',
  // Elementais.
  'fogo', 'frio', 'elétrico', 'trovejante', 'ácido', 'veneno',
  // Os outros.
  'necrótico', 'radiante', 'energético', 'psíquico',
]);

/**
 * Os três físicos. É o grupo que a Fúria resiste, o que a nota de "só de armas
 * não mágicas" separa nas fichas de monstro, e o que a pedra e o ferro fazem.
 */
export const DANOS_FISICOS = Object.freeze(['cortante', 'perfurante', 'concussão']);

/**
 * A rede não causa dano, e o campo `type` dela precisa dizer alguma coisa.
 * É sentinela, não tipo: fica de fora de `TIPOS_DE_DANO` de propósito, e o
 * teste do vocabulário a aceita por nome.
 */
export const SEM_DANO = 'nenhum';
