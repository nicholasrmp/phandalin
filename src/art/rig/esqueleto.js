// O ESQUELETO: o corpo como juntas, não como retângulos.
//
// POR QUE EXISTE
//
// Hoje cada pose é código. `drawLegs` calcula a perna a partir de `metrics` e
// de `st.agacha`; `paintDown` desenha o corpo deitado do zero; o ataque é um
// ramo dentro do pintor. Isso custa três coisas, e as três apareceram neste
// projeto:
//
//   1. Uma pose nova é código novo em vinte lugares. Foi o que fez `hurt`
//      ficar desenhado em setenta folhas e nunca ser selecionado.
//   2. O perfil é um caso especial, e caso especial quebra sozinho. A perna
//      saía em escada porque o joelho deslocava 3 px numa perna de 4.
//   3. Só existem três direções, porque só existem três ramos — `front`,
//      `side`, `back`. Oito exigiria oito ramos por membro.
//
// Com um esqueleto, a pose vira DADO: um punhado de juntas com posição. O
// pintor passa a desenhar membros entre juntas, e deixa de saber o que é
// "agachado" ou "caído". Pose nova é uma linha numa tabela.
//
// O MODELO VEIO DA API DO PIXELLAB, as medidas são nossas.
//
// Eles descrevem uma junta assim: `x` e `y` normalizados de 0 a 1, um rótulo
// de uma lista de dezoito, um `z_index` de ordem de desenho, e — a parte que
// interessa — um `depth`:
//
//     "How near the camera this joint is, 0-255 (about 128 at the body's
//      centre, higher is nearer). Optional: leave it out and it is taken from
//      the standing pose of `template_id` FOR THIS DIRECTION."
//
// Ou seja: a profundidade de cada junta sai do corpo-modelo, por direção. É
// assim que se tira oito vistas de um desenho só — não redesenhando, mas
// trocando a ordem em que os membros são pintados.
//
// AQUI VAI UM PASSO ALÉM, e é um passo barato. Em vez de guardar oito poses de
// descanso, o esqueleto mora em TRÊS DIMENSÕES e é projetado. A profundidade
// deixa de ser tabelada e passa a sair da rotação — e com isso o número de
// direções deixa de ser oito: vira quantas a folha quiser, porque é só um
// ângulo.

/**
 * AS DEZOITO JUNTAS.
 *
 * Os nomes são nossos; a lista é a do PixelLab, para o dia em que valha
 * importar ou exportar um esqueleto. "mão" e "pé" são as pontas dos membros —
 * ombro → cotovelo → mão, quadril → joelho → pé.
 */
export const JUNTAS = [
  'nariz', 'pescoco',
  'ombroD', 'cotoveloD', 'maoD',
  'ombroE', 'cotoveloE', 'maoE',
  'quadrilD', 'joelhoD', 'peD',
  'quadrilE', 'joelhoE', 'peE',
  'olhoD', 'olhoE', 'orelhaD', 'orelhaE',
];

/**
 * OS OSSOS: que par de juntas forma um membro, e com que grossura relativa.
 *
 * A ordem aqui não é a ordem de desenho — essa sai da profundidade, a cada
 * quadro. É só a lista do que ligar com o quê.
 */
// `esp` é a espessura ATRAVÉS do corpo (de ombro a ombro) e `prof` é a
// espessura POR DENTRO dele (do peito às costas). Quando as duas são iguais o
// osso é um cilindro — e foi assim que a primeira versão saiu.
//
// Isso tem consequência medível. As oito vistas do PixelLab afinam para 58% da
// largura frontal quando a criatura vira de perfil; o nosso rig cilíndrico
// afinava só para 86%, porque o tronco era tão fundo quanto largo e dominava a
// silhueta nas oito direções. Tronco de verdade é LARGO E RASO, e é essa razão
// que faz o perfil ler como perfil.
export const OSSOS = [
  { de: 'pescoco', a: 'quadrilD', esp: 0.95, prof: 0.46, parte: 'tronco' },
  { de: 'pescoco', a: 'quadrilE', esp: 0.95, prof: 0.46, parte: 'tronco' },
  { de: 'ombroD', a: 'cotoveloD', esp: 0.52, parte: 'braco' },
  { de: 'cotoveloD', a: 'maoD', esp: 0.44, parte: 'antebraco' },
  { de: 'ombroE', a: 'cotoveloE', esp: 0.52, parte: 'braco' },
  { de: 'cotoveloE', a: 'maoE', esp: 0.44, parte: 'antebraco' },
  { de: 'quadrilD', a: 'joelhoD', esp: 0.68, parte: 'coxa' },
  { de: 'joelhoD', a: 'peD', esp: 0.56, parte: 'canela' },
  { de: 'quadrilE', a: 'joelhoE', esp: 0.68, parte: 'coxa' },
  { de: 'joelhoE', a: 'peE', esp: 0.56, parte: 'canela' },
];

/**
 * O CORPO EM REPOUSO, em três dimensões.
 *
 * Os eixos, do ponto de vista de quem é desenhado:
 *   x  esquerda (-) e direita (+)
 *   y  altura a partir do chão (0 = chão, 1 = topo)
 *   z  atrás (-) e à frente (+)
 *
 * OS TRÊS EIXOS ESTÃO NA MESMA UNIDADE: alturas de figura. Isso não é
 * detalhe. A primeira versão tinha x e z em LARGURAS DE OMBRO e y em alturas,
 * e funcionou enquanto o único giro era em torno de Y — que não mistura y com
 * nada. No dia em que uma pose rolou o corpo de lado, a largura do ombro
 * passou a ser lida como altura e o dorminhoco ficou de pé: 0,97 de altura
 * quando devia ter 0,3. Eixo com unidade própria é uma bomba-relógio.
 *
 * Nada aqui está em pixels de propósito. Pixel é coisa do projetor, e o mesmo
 * esqueleto tem de servir ao goblin de 41 px e ao bugbear de 73.
 *
 * O `z` é o que faz as oito direções funcionarem. Um corpo chapado — tudo com
 * z = 0 — gira e continua chapado: de perfil, os dois braços caem no mesmo
 * lugar e a figura perde o volume. Os valores abaixo põem os braços um pouco
 * à frente do tronco e os pés levemente alternados, que é o mínimo para o
 * perfil ler como perfil.
 */
export const BIPEDE = {
  nariz:    { x: +0.000, y: 0.93, z: +0.066 },
  pescoco:  { x: +0.000, y: 0.84, z: +0.000 },

  olhoD:    { x: -0.030, y: 0.95, z: +0.054 },
  olhoE:    { x: +0.030, y: 0.95, z: +0.054 },
  orelhaD:  { x: -0.060, y: 0.95, z: -0.015 },
  orelhaE:  { x: +0.060, y: 0.95, z: -0.015 },

  ombroD:   { x: -0.150, y: 0.82, z: +0.000 },
  cotoveloD: { x: -0.174, y: 0.66, z: +0.018 },
  maoD:     { x: -0.180, y: 0.50, z: +0.036 },
  ombroE:   { x: +0.150, y: 0.82, z: +0.000 },
  cotoveloE: { x: +0.174, y: 0.66, z: +0.018 },
  maoE:     { x: +0.180, y: 0.50, z: +0.036 },

  quadrilD: { x: -0.078, y: 0.50, z: +0.000 },
  joelhoD:  { x: -0.084, y: 0.26, z: +0.009 },
  peD:      { x: -0.084, y: 0.00, z: +0.018 },
  quadrilE: { x: +0.078, y: 0.50, z: +0.000 },
  joelhoE:  { x: +0.084, y: 0.26, z: +0.009 },
  peE:      { x: +0.084, y: 0.00, z: -0.006 },
};

/**
 * Quadrúpede: o mesmo vocabulário de juntas, outro arranjo.
 *
 * O PixelLab resolve isso com `template_id` — `mannequin` para bípede,
 * `bear`/`cat`/`dog`/`horse`/`lion` para quadrúpede. A ideia é a mesma: o
 * esqueleto não muda de linguagem, muda de pose de repouso. Os braços viram
 * as patas da frente e o nariz sai à frente do pescoço, não acima.
 */
export const QUADRUPEDE = {
  nariz:    { x: +0.000, y: 0.62, z: +0.285 },
  pescoco:  { x: +0.000, y: 0.60, z: +0.138 },

  olhoD:    { x: -0.036, y: 0.66, z: +0.240 },
  olhoE:    { x: +0.036, y: 0.66, z: +0.240 },
  orelhaD:  { x: -0.054, y: 0.74, z: +0.186 },
  orelhaE:  { x: +0.054, y: 0.74, z: +0.186 },

  ombroD:   { x: -0.090, y: 0.56, z: +0.114 },
  cotoveloD: { x: -0.096, y: 0.30, z: +0.108 },
  maoD:     { x: -0.096, y: 0.00, z: +0.120 },
  ombroE:   { x: +0.090, y: 0.56, z: +0.114 },
  cotoveloE: { x: +0.096, y: 0.30, z: +0.108 },
  maoE:     { x: +0.096, y: 0.00, z: +0.132 },

  quadrilD: { x: -0.090, y: 0.56, z: -0.150 },
  joelhoD:  { x: -0.096, y: 0.28, z: -0.168 },
  peD:      { x: -0.096, y: 0.00, z: -0.144 },
  quadrilE: { x: +0.090, y: 0.56, z: -0.150 },
  joelhoE:  { x: +0.096, y: 0.28, z: -0.168 },
  peE:      { x: +0.096, y: 0.00, z: -0.156 },
};

/**
 * Proporções nomeadas, como o `CharacterProportionsPreset` deles
 * (`default`, `chibi`, `cartoon`, `stylized`, `realistic_male`,
 * `realistic_female`, `heroic`).
 *
 * Aqui são multiplicadores sobre o esqueleto de repouso, não um esqueleto
 * novo: `cabeca` empurra as juntas da cabeça para cima e para fora, `membro`
 * estica braços e pernas, `ombro` alarga. Um goblin é quase `chibi` com perna
 * curta; um bugbear é `heroic` de braço longo.
 */
export const PROPORCOES = {
  normal:   { cabeca: 1.00, membro: 1.00, ombro: 1.00 },
  chibi:    { cabeca: 1.45, membro: 0.72, ombro: 0.88 },
  desenho:  { cabeca: 1.22, membro: 0.88, ombro: 0.95 },
  heroico:  { cabeca: 0.90, membro: 1.08, ombro: 1.18 },
  magro:    { cabeca: 1.00, membro: 1.06, ombro: 0.86 },
  // GOBLIN: largo e baixo, não longilíneo.
  //
  // Medido, a referência tem caixa de 195x216 — razão 0,90. O nosso saía
  // 129x249, razão 0,52: um manequim esguio. A skill `pixel-art` põe o padrão
  // em 3:4 e explica a direção: "wider characters feel sturdy/heavy", que é
  // exatamente o que um goblin corcunda tem de ser.
  //
  // Ombro bem mais largo, membro bem mais curto, cabeça grande.
  goblin:   { cabeca: 1.34, membro: 0.76, ombro: 1.52 },
};

/** Juntas da cabeça — as que `proporcoes.cabeca` afasta do pescoço. */
const DA_CABECA = new Set(['nariz', 'olhoD', 'olhoE', 'orelhaD', 'orelhaE']);
/** Juntas de membro — as que `proporcoes.membro` afasta da raiz. */
const DO_MEMBRO = new Set([
  'cotoveloD', 'maoD', 'cotoveloE', 'maoE',
  'joelhoD', 'peD', 'joelhoE', 'peE',
]);

/**
 * Aplica as proporções a um corpo de repouso. Devolve um corpo novo.
 */
export function comProporcoes(corpo, prop = PROPORCOES.normal) {
  const pescoco = corpo.pescoco;
  const fora = {};
  for (const [nome, j] of Object.entries(corpo)) {
    let { x, y, z } = j;
    if (DA_CABECA.has(nome)) {
      // A cabeça cresce A PARTIR DO PESCOÇO, não a partir do chão: escalando
      // do chão, um chibi ficaria com a cabeça flutuando longe do corpo.
      x = pescoco.x + (x - pescoco.x) * prop.cabeca;
      y = pescoco.y + (y - pescoco.y) * prop.cabeca;
      z = pescoco.z + (z - pescoco.z) * prop.cabeca;
    }
    if (DO_MEMBRO.has(nome)) y *= prop.membro;
    if (nome.startsWith('ombro') || nome.startsWith('quadril')) x *= prop.ombro;
    fora[nome] = { x, y, z };
  }
  return fora;
}

/**
 * PROJETA o esqueleto para a tela, virado para um ângulo.
 *
 * @param {object} corpo   juntas em 3D (um dos corpos acima, já com proporções)
 * @param {number} angulo  para onde a criatura olha, em radianos. 0 é de
 *                         frente para o jogador; cresce girando para a direita
 *                         de quem olha.
 * @param {object} escala  { alt } em pixels, a altura da figura — é só aqui
 *                         que pixel aparece. `largura` estica ou estreita a
 *                         criatura sem mexer no esqueleto.
 * @returns {object} juntas em { x, y, prof } — x e y em pixels a partir do
 *                   centro e do chão (y negativo para cima, como o resto do
 *                   pintor), e `prof` de 0 a 255 como no modelo deles: 128 no
 *                   centro do corpo, maior quer dizer mais perto da câmera.
 */
export function projetar(corpo, angulo, { alt, largura = 1 }) {
  const cos = Math.cos(angulo);
  const sen = Math.sin(angulo);
  const fora = {};
  for (const [nome, j] of Object.entries(corpo)) {
    // Giro em torno do eixo vertical. O que some na largura reaparece na
    // profundidade — é por isso que um corpo chapado (z = 0) continua chapado
    // depois de girar, e por isso que o repouso tem z.
    const x = j.x * cos + j.z * sen;
    const z = -j.x * sen + j.z * cos;
    fora[nome] = {
      x: x * alt * largura,
      y: -j.y * alt,                                   // y cresce para cima
      prof: Math.max(0, Math.min(255, Math.round(128 + z * 420))),
    };
  }
  return fora;
}

/**
 * A espessura que um osso MOSTRA quando o corpo está virado para `angulo`.
 *
 * É uma elipse: de frente vê-se a largura (`esp`), de perfil a profundidade
 * (`prof`), e no meio o caminho entre as duas. Osso sem `prof` declarado é
 * redondo — serve para braço e perna, que são aproximadamente cilíndricos.
 */
export function espessuraVista(osso, angulo) {
  const prof = osso.prof ?? osso.esp;
  const c = Math.cos(angulo);
  const s = Math.sin(angulo);
  return Math.hypot(osso.esp * c, prof * s);
}

/**
 * A ordem de desenho de um quadro já projetado: do mais longe para o mais
 * perto. É isto que o `z_index` deles faz, e é o que dá volume ao perfil sem
 * desenhar o perfil.
 */
export function ordemDeDesenho(juntas, ossos = OSSOS) {
  return ossos
    .map((o) => ({ ...o, prof: (juntas[o.de].prof + juntas[o.a].prof) / 2 }))
    .sort((a, b) => a.prof - b.prof);
}
