// LOOK do dragao. Arquivo proprio porque o dragao e a unica criatura do jogo
// com plano corporal so dele, e porque ele e o chefe final: mexer nele nao
// pode arrastar junto as aberracoes.
//
// PALETA — por que estes valores e nao outros (REFERENCIAS.md secao 11)
// A referencia tem TRES verdes que precisam ficar separados em valor, senao a
// figura vira uma mancha so nos 52x80 da celula:
//   1. dorso verde-oliva ESCURO, que carrega a silhueta contra o tabuleiro;
//   2. flanco oliva medio, o tom "base" da escama;
//   3. membrana da asa verde-CLARA puxada para o amarelo — e ela que abre a
//      silhueta para os lados, entao tem de ser o mais claro da figura depois
//      do ventre, ou a asa aberta some contra as costas.
// O ventre amarelo-esverdeado e mais claro ainda: e o unico descanso do olho.
// A nervura escura (`leather`) existe para a membrana nao ler como pano: sem o
// desenho dos dedos por cima, uma cunha clara e uma capa, nao uma asa.
//
// E tres materiais duros, nao um: na referencia a COROA e os ESPINHOS sao
// verde quase preto (`horn`), a GARRA e um corno acinzentado medio (`claw`) e
// so o DENTE e marfim (`metal`). Pintar os tres no mesmo marfim punha o ponto
// mais claro da figura no alto da cabeca: a coroa lia como antena e a crista
// do dorso como colar de contas.
//
// Ver REFERENCIAS.md secao 11 e ELENCO.md para o contrato do look.

export const DRAGAO_LOOKS = {
  dragaoVerdeJovem: {
    plan: 'dragao',
    outfit: '#4a7236',      // flanco: oliva medio
    outfitDark: '#27401d',  // dorso: oliva escuro
    trim: '#c2c86e',        // ventre em placas amarelo-esverdeadas
    cloak: '#a3b25c',       // membrana da asa, verde-clara amarelada
    leather: '#3a4a1f',     // nervura da asa
    horn: '#1e2f12',        // coroa, crista e espinhos do dorso: escuros
    claw: '#9a8f73',        // garra de pe, de mao e da dobra da asa
    metal: '#e4dec3',       // so dente
    eyes: '#efa81e',
    glow: '#a6e02c',        // goela acesa no quadro do sopro
  },
};
