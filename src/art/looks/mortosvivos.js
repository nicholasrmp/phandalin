// LOOKS dos mortos-vivos.
//
// Ver ELENCO.md para o contrato completo do look e a escala em pixels.
// Pareia com o arquivo de mesma família em `rules/monsters/`: todo monstro de
// lá aponta um `look` daqui.
//
// TODOS usam `plan: 'mortoVivo'`, e quem escolhe a leitura é `undead`:
//   'esqueleto' | 'zumbi' | 'ghoul' | 'espectro' | 'specter' | 'wraith'
// São SEIS pintores diferentes. `specter` e `wraith` já caíram no mesmo pintor
// de `espectro`, e é por isso que as duas figuras eram idênticas pixel a pixel;
// hoje cada uma tem o seu, e `espectro` é só o vulto encapuzado de Agatha.
//
// CAMPOS QUE O PLANO LÊ — e só estes. `plans/mortoVivo.js` não passa por
// `body.js`, então `species`, `build`, `heightMul`, `stance`, `marca`, `face` e
// `facial` NÃO têm efeito aqui: aquilo é vocabulário do pintor humanoide. Pôr
// `heightMul` num morto-vivo é o tipo de campo que parece funcionar e não faz
// nada; por isso nenhum destes looks tem um.
//
//   esqueleto  bone (ou skin) · eyeSocket · glow (ou eyes), opcional
//   zumbi      skin · rot · outfit · outfitDark · eyes
//   ghoul      skin · claw · mouth · tongue · eyes · wrap
//   espectro   cloak (ou outfit) · glow (ou eyes) · void
//   specter    cloak (ou outfit) · glow (ou eyes) · void
//   wraith     cloak (ou outfit) · glow (ou eyes) · void · metal (ou helm)
//
// `tongue` e `wrap` são novos e só o ghoul usa: a língua pendurada é a
// assinatura dele e as faixas de pano são o que tira o corpo de "palito liso".
// `metal` já existia no vocabulário dos NPCs e virou o elmo do wraith, para o
// look de Mormesk não precisar de campo novo.
//
// O DEFEITO 4 DO ELENCO (a paleta do inimigo virou uma lama só) se conserta
// aqui, separando VALOR antes de matiz. As cinco figuras ocupam cinco faixas
// afastadas, e é por isso que elas podem aparecer no mesmo encontro:
//
//   esqueleto  claro e quente       — o mais claro do elenco inteiro
//   ghoul      claro e frio         — com a garra quase branca, acima de tudo
//   zumbi      médio e esverdeado   — o único de valor médio
//   specter    médio-claro, violeta — translúcido e aceso, o único roxo
//   wraith     quase preto, fumaça  — com o único brilho QUENTE da família
//
// O par specter/wraith era o "par quase idêntico" (defeito 6) desta família:
// mesmo pintor, mesma pose, mesma altura, IoU 1,000. Cor não resolvia, porque
// a 55 px só a mancha chega ao jogador. Resolvido no plano, por MASSA: um
// alarga para baixo num sino de névoa, o outro afina até virar fiapo e abre os
// braços para os lados. A cor aqui é o reforço, não a diferença.

export const MORTOS_VIVOS_LOOKS = {

  // SILHUETA: figura ereta e vazada, de membros finos como gravetos, cujo
  // tronco é uma gaiola de barras com vãos abertos sob um crânio de mandíbula
  // solta.
  //
  // Osso bege-claro e quente de propósito: o esqueleto é a figura mais clara
  // do tabuleiro, e isso o separa do zumbi (médio) à distância em que só a
  // mancha chega ao jogador. Sem `glow`: a órbita vazia é mais assustadora que
  // a órbita acesa, e deixa a luz dentro do crânio como marca exclusiva do
  // espectro — dois mortos-vivos com fogo nos olhos seriam o mesmo bicho.
  skeleton: {
    plan: 'mortoVivo', undead: 'esqueleto',
    bone: '#e4d8b4', eyeSocket: '#17131d',
  },

  // SILHUETA: tronco pesado e inclinado, um ombro muito mais alto que o outro,
  // a cabeça pendendo para o lado do ombro caído e a barra do pano desfiada
  // sobre as pernas.
  //
  // Valor médio em tudo, porque o zumbi é o fundo contra o qual os outros
  // quatro se destacam. O verde da pele e o verde da podridão estão a dois
  // degraus de distância um do outro: mais perto que isso e a mancha desaparece
  // na pele; mais longe e vira tatuagem.
  zombie: {
    plan: 'mortoVivo', undead: 'zumbi',
    skin: '#8a9a74', rot: '#43503a',
    outfit: '#6b5a42', outfitDark: '#44382a',
    eyes: '#cfcdae',
  },

  // SILHUETA: figura magra em meia passada de corrida, com um pé no ar e o
  // outro plantado atrás, cabeça erguida acima do ombro e uma língua pendurada
  // por fora do queixo, mãos em leque maiores que a própria cabeça.
  //
  // Pele branco-azulada e FRIA, quase sem matiz: é o que impede o ghoul de ser
  // lido como "zumbi magro". A garra é o elemento-herói e por isso é o pixel
  // mais claro da figura inteira — o olho vai primeiro nela, que é exatamente a
  // parte que o jogador precisa temer.
  //
  // O OLHO É APAGADO, de propósito: a luz dentro do crânio é marca exclusiva do
  // specter e do wraith, e três mortos-vivos com fogo nos olhos seriam o mesmo
  // bicho. A língua é o único pedaço de cor viva da figura e fica sozinha
  // contra o branco-azulado — é ela que o jogador vê primeiro depois da garra.
  ghoul: {
    plan: 'mortoVivo', undead: 'ghoul',
    skin: '#c3ced6', claw: '#f6f0e4',
    mouth: '#5c2630', tongue: '#b35b65',
    eyes: '#23202b', wrap: '#bdb09a',
  },

  // SILHUETA: caveira de cabelo em filamentos abertos em coroa, tronco
  // descarnado com os dois braços dobrados longe do corpo, e da cintura para
  // baixo um sino de névoa que alarga sem encostar no chão.
  //
  // Violeta LUMINOSO por inteiro, translúcido: o tabuleiro aparece por dentro.
  // Ele é a única figura de matiz roxo do elenco e a mais clara das três
  // incorpóreas — lê como fumaça acesa, não como buraco. O brilho é
  // branco-violeta e aparece em DOIS lugares, nas órbitas e nos dentes, que
  // são a segunda coisa que o olho encontra depois da coroa de cabelo.
  specter: {
    plan: 'mortoVivo', undead: 'specter',
    cloak: '#8a58c6', glow: '#f4ecff', void: '#2a1442',
  },

  // SILHUETA: duas pontas de elmo no alto de uma cabeça afundada entre ombros
  // corcundas, dois braços longos demais abertos para os lados com os dedos se
  // desfazendo em fiapos, e um corpo que afina até virar um feixe de tiras.
  //
  // Leitura OPOSTA à do specter em tudo, e de propósito: ele alarga para
  // baixo, este afina; ele é roxo claro, este é fumaça quase preta; ele tem a
  // cara à mostra, este tem a cara enterrada num elmo. O wraith é a figura
  // mais ESCURA do elenco e a 55 px lê como um buraco no tabuleiro.
  //
  // O brilho troca de MATIZ, e não só de intensidade: amarelo QUENTE dentro do
  // preto, contra o branco-violeta frio do specter. Matiz diferente sobrevive
  // à miniatura; "um pouco mais escuro" não sobrevive.
  //
  // `metal` é o elmo — o único pedaço sólido da figura inteira, e o motivo de
  // o olho pousar na cabeça em vez de escorregar pela fumaça. O campo já
  // existia no vocabulário dos looks de NPC, então Mormesk ganha o elmo dele
  // sem precisar de campo novo.
  wraith: {
    plan: 'mortoVivo', undead: 'wraith',
    cloak: '#262a31', glow: '#ffcf3d', void: '#080a0d',
    metal: '#5e6773',
  },

};
