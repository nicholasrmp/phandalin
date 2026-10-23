// LOOKS dos mortos-vivos.
//
// Ver ELENCO.md para o contrato completo do look e a escala em pixels.
// Pareia com o arquivo de mesma família em `rules/monsters/`: todo monstro de
// lá aponta um `look` daqui.
//
// TODOS usam `plan: 'mortoVivo'`, e quem escolhe a leitura é `undead`:
//   'esqueleto' | 'zumbi' | 'ghoul' | 'espectro' | 'specter' | 'wraith'
// (os três últimos caem no mesmo pintor de espectro).
//
// CAMPOS QUE O PLANO LÊ — e só estes. `plans/mortoVivo.js` não passa por
// `body.js`, então `species`, `build`, `heightMul`, `stance`, `marca`, `face` e
// `facial` NÃO têm efeito aqui: aquilo é vocabulário do pintor humanoide. Pôr
// `heightMul` num morto-vivo é o tipo de campo que parece funcionar e não faz
// nada; por isso nenhum destes looks tem um.
//
//   esqueleto  bone (ou skin) · eyeSocket · glow (ou eyes), opcional
//   zumbi      skin · rot · outfit · outfitDark · eyes
//   ghoul      skin · claw · mouth · eyes
//   espectro   cloak (ou outfit) · glow (ou eyes) · void
//
// O DEFEITO 4 DO ELENCO (a paleta do inimigo virou uma lama só) se conserta
// aqui, separando VALOR antes de matiz. As cinco figuras ocupam cinco faixas
// afastadas, e é por isso que elas podem aparecer no mesmo encontro:
//
//   esqueleto  claro e quente      — o mais claro do elenco inteiro
//   ghoul      claro e frio        — com a garra quase branca, acima de tudo
//   zumbi      médio e esverdeado  — o único de valor médio
//   espectro   escuro e azul       — translúcido, com um ponto de luz gelada
//   wraith     quase preto, anil   — translúcido, com um ponto de luz VERDE
//
// O par espectro/wraith é o perigo de "par quase idêntico" (defeito 6) desta
// família: mesmo pintor, mesma pose, mesma altura. Separá-los é trabalho de
// cor e de valor — o manto do wraith está três degraus mais escuro e o brilho
// dele muda de matiz, não só de intensidade. Ainda não basta; ver o relatório.

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

  // SILHUETA: vulto dobrado para a frente, de costas arqueadas, que avança
  // com dois braços longos demais terminados em garras maiores que a própria
  // cabeça.
  //
  // Pele clara e FRIA, quase lilás: é o que impede o ghoul de ser lido como
  // "zumbi grande". A garra é o elemento-herói e por isso é o pixel mais claro
  // da figura inteira — o olho vai primeiro nela, que é exatamente a parte que
  // o jogador precisa temer. A boca em vermelho sujo é a única cor saturada.
  ghoul: {
    plan: 'mortoVivo', undead: 'ghoul',
    skin: '#ad9ea6', claw: '#f4ece0',
    mouth: '#7c2f34', eyes: '#eed76b',
  },

  // SILHUETA: vulto encapuzado de ombros largos, sem perna nenhuma, que
  // termina numa franja suspensa sem nada tocando o chão.
  //
  // Azul médio e dessaturado, translúcido: o tabuleiro aparece por dentro.
  // O brilho é branco-azulado gelado, e fica dentro de um capuz quase preto
  // porque o contraste local é o que faz dois pixels de luz lerem a 55 px.
  specter: {
    plan: 'mortoVivo', undead: 'specter',
    cloak: '#5d7694', glow: '#aef0ff', void: '#121626',
  },

  // SILHUETA: a mesma do espectro — e é esse o problema, resolvido só por cor
  // até o plano aceitar altura (ver relatório).
  //
  // Manto anil quase preto: o wraith é a figura mais ESCURA do elenco, três
  // degraus abaixo do espectro, e a 55 px lê como um buraco no tabuleiro
  // enquanto o espectro lê como fumaça. O brilho troca de MATIZ, não de
  // intensidade: verde-veneno em vez de branco-gelo. Matiz diferente sobrevive
  // à miniatura; "um pouco mais escuro" não sobrevive.
  wraith: {
    plan: 'mortoVivo', undead: 'wraith',
    cloak: '#232a44', glow: '#7cf0b4', void: '#0b0d16',
  },

};
