// AS POSES, COMO DADOS.
//
// Hoje uma pose é código: `drawLegs` lê `st.agacha`, o ataque é um ramo dentro
// do pintor, e `paintDown` desenha o corpo deitado do zero em três caixas.
// Aqui uma pose é uma tabela de ângulos, e o pintor não sabe o que é
// "agachado" nem "caído" — ele desenha os ossos onde eles estiverem.
//
// POR QUE ÂNGULOS, E NÃO DESLOCAMENTOS
//
// A tentação é escrever a pose como "a mão sobe tanto, o pé vai tanto para a
// frente". É mais fácil de escrever e está errado: mover a mão sem mover o
// cotovelo ESTICA o antebraço. Num quadro parado ninguém nota; num ciclo de
// quatro quadros a perna cresce e encolhe, e a figura lê como borracha.
//
// Com ângulos o comprimento do osso é constante POR CONSTRUÇÃO — o cotovelo
// nasce a uma distância fixa do ombro, a mão a uma distância fixa do cotovelo.
// O comprimento sai do corpo em repouso, então um goblin de braço curto e um
// bugbear de braço longo usam a MESMA pose e continuam cada um com o seu
// braço.
//
// OS EIXOS, repetidos de `esqueleto.js` porque é onde se erra o sinal:
//   x  esquerda (-) / direita (+)
//   y  altura a partir do chão
//   z  atrás (-) / à frente (+)
//
// Daí: balançar um membro para a frente gira em torno de X; abrir para o lado
// gira em torno de Z; torcer o tronco gira em torno de Y; e TOMBAR — deitar —
// também gira em torno de X, só que o corpo inteiro.

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const esc = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const comp = (a) => Math.hypot(a.x, a.y, a.z);

const rotX = (p, a) => {
  const c = Math.cos(a); const s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
};
const rotY = (p, a) => {
  const c = Math.cos(a); const s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
};
const rotZ = (p, a) => {
  const c = Math.cos(a); const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
};

/** Gira `p` em torno de `o`, aplicando `f`. */
const emTorno = (p, o, f) => add(o, f(sub(p, o)));

const G = Math.PI / 180;   // graus para radianos, porque tabela em radianos não se lê

/**
 * A POSE NEUTRA. Toda pose é esta com campos por cima.
 *
 * `balanco` é frente (+) e trás (−); `abre` afasta do corpo; `dobra` é o
 * cotovelo ou o joelho, sempre para o lado anatômico. Tudo em GRAUS.
 */
export const NEUTRA = {
  raiz: { x: 0, y: 0, z: 0 },   // em alturas de figura; y negativo agacha
  inclina: 0,                   // tronco para a frente (+) ou para trás (−)
  torce: 0,                     // tronco girando sobre o próprio eixo
  tombo: 0,                     // 90 deita de costas, cabeça para a frente
  // ROLAR é o eixo que faltava. Tombar põe a figura de COSTAS; quem dorme
  // encolhido está de LADO, e isso é um giro em torno do próprio comprimento.
  // Sem ele, a única forma de "encolher" era dobrar no eixo frente-trás — que
  // depois do tombo vira o eixo vertical, e os joelhos apontam para o céu.
  rola: 0,                      // 90 vira de lado, depois de tombado
  cabeca: { inclina: 0, gira: 0 },
  bracoD: { balanco: 0, abre: 0, dobra: 0 },
  bracoE: { balanco: 0, abre: 0, dobra: 0 },
  pernaD: { balanco: 0, abre: 0, dobra: 0 },
  pernaE: { balanco: 0, abre: 0, dobra: 0 },
};

const juntar = (p) => ({
  ...NEUTRA, ...p,
  raiz: { ...NEUTRA.raiz, ...(p.raiz || {}) },
  cabeca: { ...NEUTRA.cabeca, ...(p.cabeca || {}) },
  bracoD: { ...NEUTRA.bracoD, ...(p.bracoD || {}) },
  bracoE: { ...NEUTRA.bracoE, ...(p.bracoE || {}) },
  pernaD: { ...NEUTRA.pernaD, ...(p.pernaD || {}) },
  pernaE: { ...NEUTRA.pernaE, ...(p.pernaE || {}) },
});

const CABECA = ['nariz', 'olhoD', 'olhoE', 'orelhaD', 'orelhaE'];
const ACIMA_DO_QUADRIL = ['pescoco', 'ombroD', 'ombroE', ...CABECA];

/**
 * Aplica uma pose a um corpo em repouso. Devolve juntas novas, em 3D.
 *
 * @param {object} corpo  o esqueleto de repouso, já com proporções
 * @param {object} pose   campos sobre `NEUTRA`, em graus
 */
export function aplicarPose(corpo, pose) {
  const p = juntar(pose);
  const fora = {};
  for (const [n, j] of Object.entries(corpo)) fora[n] = { ...j };

  // ---- o tronco -------------------------------------------------------------
  // O quadril é o eixo: inclinar e torcer giram o que está ACIMA dele, e só.
  // Girando o corpo todo, a figura afundaria no chão ao se curvar.
  const quadril = {
    x: (corpo.quadrilD.x + corpo.quadrilE.x) / 2,
    y: (corpo.quadrilD.y + corpo.quadrilE.y) / 2,
    z: (corpo.quadrilD.z + corpo.quadrilE.z) / 2,
  };
  for (const n of ACIMA_DO_QUADRIL) {
    let v = fora[n];
    if (p.inclina) v = emTorno(v, quadril, (q) => rotX(q, p.inclina * G));
    if (p.torce) v = emTorno(v, quadril, (q) => rotY(q, p.torce * G));
    fora[n] = v;
  }

  // ---- a cabeça -------------------------------------------------------------
  const pescoco = fora.pescoco;
  for (const n of CABECA) {
    let v = fora[n];
    if (p.cabeca.inclina) v = emTorno(v, pescoco, (q) => rotX(q, p.cabeca.inclina * G));
    if (p.cabeca.gira) v = emTorno(v, pescoco, (q) => rotY(q, p.cabeca.gira * G));
    fora[n] = v;
  }

  // ---- os quatro membros ----------------------------------------------------
  // O COMPRIMENTO VEM DO REPOUSO e nunca é recalculado a partir da pose: é
  // isto que impede a perna de crescer no meio do ciclo.
  const cadeia = (raiz, meio, ponta, ang, lado) => {
    const L1 = comp(sub(corpo[meio], corpo[raiz]));
    const L2 = comp(sub(corpo[ponta], corpo[meio]));
    let d1 = { x: 0, y: -1, z: 0 };                 // repouso: pendurado
    // O SINAL É NEGATIVO DE PROPÓSITO. Girando (0,−1,0) em torno de X por um
    // ângulo positivo, o z resultante é −sen(ângulo): o membro vai para TRÁS.
    // A tabela de poses diz "balanço é frente (+)", então quem se ajusta é o
    // código. Era este sinal que mandava os braços do dormindo para trás — e o
    // tombo, que troca z por y, os punha apontando para o céu.
    d1 = rotX(d1, -ang.balanco * G);
    d1 = rotZ(d1, ang.abre * G * lado);
    fora[meio] = add(fora[raiz], esc(d1, L1));
    const d2 = rotX(d1, -ang.dobra * G);
    fora[ponta] = add(fora[meio], esc(d2, L2));
  };
  cadeia('ombroD', 'cotoveloD', 'maoD', p.bracoD, -1);
  cadeia('ombroE', 'cotoveloE', 'maoE', p.bracoE, +1);
  cadeia('quadrilD', 'joelhoD', 'peD', p.pernaD, -1);
  cadeia('quadrilE', 'joelhoE', 'peE', p.pernaE, +1);

  // ---- o tombo --------------------------------------------------------------
  // Deitar é o corpo INTEIRO girando em torno do chão. Com isso as poses de
  // chão deixam de ser um desenho à parte: caído, dormindo e morto são a mesma
  // figura de sempre, tombada — e giram com a câmera como qualquer outra, que
  // é o que `paintDown` nunca soube fazer.
  if (p.tombo || p.rola) {
    const chao = { x: 0, y: 0, z: 0 };
    if (p.tombo) {
      // O SINAL É NEGATIVO, e custou duas tentativas descobrir.
      //
      // Girando em torno de X, a altura NOVA sai inteiramente do z ANTIGO: o
      // pivô escolhido só desloca tudo junto, não muda quem fica em cima. Com
      // o giro positivo a frente do corpo (+z) vai para BAIXO — a figura deita
      // de bruços, o nariz enterra, e o passo de assentar levanta os pés. Foi
      // exatamente o que apareceu: pé a 0,435 de altura e nariz a 0,018.
      //
      // Deitar DE COSTAS é o giro contrário: a frente do corpo olha para cima.
      for (const n of Object.keys(fora)) {
        fora[n] = emTorno(fora[n], chao, (q) => rotX(q, -p.tombo * G));
      }
    }
    // Rolar vem DEPOIS de tombar: já deitada, a figura tem o comprimento ao
    // longo de z, e girar em torno de z é girar em torno do próprio corpo.
    if (p.rola) {
      for (const n of Object.keys(fora)) {
        fora[n] = emTorno(fora[n], chao, (q) => rotZ(q, p.rola * G));
      }
    }
    // E DEPOIS O CORPO ASSENTA NO CHÃO.
    //
    // O giro é em torno da origem, então toda junta que estava à frente (z
    // positivo — o nariz, as mãos) termina com y negativo: enterrada. Sem
    // este passo o morto fica meio soterrado e o que sobra acima da linha do
    // chão lê como outra coisa. Subir até a junta mais baixa encostar é o que
    // põe a figura DEITADA em vez de afundada.
    let menor = Infinity;
    for (const n of Object.keys(fora)) menor = Math.min(menor, fora[n].y);
    if (menor < 0) for (const n of Object.keys(fora)) fora[n].y -= menor;
  }

  // ---- a raiz ---------------------------------------------------------------
  if (p.raiz.x || p.raiz.y || p.raiz.z) {
    for (const n of Object.keys(fora)) fora[n] = add(fora[n], p.raiz);
  }
  return fora;
}

// ---------------------------------------------------------------------------
// AS SETE ANIMAÇÕES, treze quadros.
//
// Os nomes e as contagens são os de `src/art/sheet.js` (ANIMS), para a
// migração ser uma troca e não uma tradução.
// ---------------------------------------------------------------------------

/** Braços pendurados, levemente abertos e dobrados: ninguém fica de braço reto. */
const BRACO_SOLTO_D = { balanco: -6, abre: 7, dobra: 14 };
const BRACO_SOLTO_E = { balanco: -6, abre: 7, dobra: 14 };
/** Goblin é corcunda e agachado: o repouso dele já tem joelho dobrado. */
const PERNA_BASE_D = { balanco: 4, abre: 3, dobra: -12 };
const PERNA_BASE_E = { balanco: -4, abre: 3, dobra: -12 };

const parado = (respira) => ({
  raiz: { y: respira ? -0.012 : 0 },
  inclina: 9,
  cabeca: { inclina: -5 },
  bracoD: { ...BRACO_SOLTO_D, balanco: BRACO_SOLTO_D.balanco + (respira ? 2 : 0) },
  bracoE: { ...BRACO_SOLTO_E, balanco: BRACO_SOLTO_E.balanco + (respira ? 2 : 0) },
  pernaD: PERNA_BASE_D,
  pernaE: PERNA_BASE_E,
});

/**
 * ANDAR em quatro quadros: contato, passagem, contato oposto, passagem.
 *
 * Dois quadros não bastam — a perna vai e volta e lê como tremor. E o braço
 * balança em OPOSIÇÃO à perna do mesmo lado, que é o que separa andar de
 * desfilar.
 */
const andar = (i) => {
  const fase = [1, 0, -1, 0][i];        // +1 perna D à frente, −1 perna E
  const passagem = i % 2 === 1;
  return {
    raiz: { y: passagem ? 0.015 : 0 },  // o corpo sobe ao passar
    inclina: 11,
    cabeca: { inclina: -6 },
    bracoD: { balanco: -22 * fase, abre: 6, dobra: 22 },
    bracoE: { balanco: 22 * fase, abre: 6, dobra: 22 },
    pernaD: { balanco: 26 * fase, abre: 3, dobra: fase > 0 ? -8 : -30 },
    pernaE: { balanco: -26 * fase, abre: 3, dobra: fase < 0 ? -8 : -30 },
  };
};

/** ATAQUE: o quadro 0 carrega, o 1 descarrega. O tronco torce nos dois. */
const ATAQUE = [
  {
    raiz: { y: -0.03 },
    inclina: -6, torce: -24,
    cabeca: { gira: 14 },
    bracoD: { balanco: -120, abre: 22, dobra: 62 },   // arma atrás da cabeça
    bracoE: { balanco: 28, abre: 18, dobra: 48 },     // escudo subindo
    pernaD: { balanco: -12, abre: 5, dobra: -26 },
    pernaE: { balanco: 10, abre: 5, dobra: -16 },
  },
  {
    raiz: { y: -0.05, z: 0.10 },
    inclina: 26, torce: 20,
    cabeca: { inclina: 10, gira: -8 },
    bracoD: { balanco: 72, abre: 12, dobra: 10 },     // o golpe desce à frente
    bracoE: { balanco: -34, abre: 30, dobra: 40 },    // escudo jogado para fora
    pernaD: { balanco: 34, abre: 6, dobra: -14 },     // avança sobre o pé da frente
    pernaE: { balanco: -26, abre: 5, dobra: -34 },
  },
];

/** DANO: a cabeça chicoteia para trás e os braços abrem. Tem de ler como golpe. */
const DANO = {
  raiz: { y: -0.02, z: -0.05 },
  inclina: -26,
  cabeca: { inclina: -24 },
  bracoD: { balanco: -52, abre: 46, dobra: 26 },
  bracoE: { balanco: -52, abre: 46, dobra: 26 },
  pernaD: { balanco: -16, abre: 9, dobra: -40 },
  pernaE: { balanco: 12, abre: 9, dobra: -32 },
};

/** CAÍDO mas acordado: tombo parcial, apoiado num braço, cabeça ERGUIDA. */
const CAIDO = {
  tombo: 72,
  rola: 26,          // meio de lado: é o que o braço de apoio exige
  inclina: -26,
  cabeca: { inclina: -34 },
  bracoD: { balanco: 18, abre: 16, dobra: 24 },
  bracoE: { balanco: -74, abre: 26, dobra: 36 },   // o braço que empurra o chão
  pernaD: { balanco: 16, abre: 12, dobra: -52 },
  pernaE: { balanco: -8, abre: 8, dobra: -36 },
};

/** DORMINDO: tombo inteiro, corpo encolhido, peito subindo um pixel. */
const dormindo = (respira) => ({
  tombo: 90,
  // DE LADO, não de costas: é o que distingue dormir de morrer na silhueta.
  // Rolando o corpo, o encolhimento fetal — que mora no eixo frente-trás —
  // volta a ser horizontal e os joelhos vão ao peito em vez de ao céu.
  rola: 78,
  inclina: -14,
  cabeca: { inclina: -18 },
  raiz: { y: respira ? 0.008 : 0 },
  bracoD: { balanco: 48, abre: 8, dobra: 72 },
  bracoE: { balanco: 36, abre: 6, dobra: 78 },
  pernaD: { balanco: 52, abre: 5, dobra: -84 },
  pernaE: { balanco: 40, abre: 5, dobra: -74 },
});

/** MORTO: tombo inteiro e membros ABERTOS. É o oposto do encolhido. */
const MORTO = {
  tombo: 90,
  inclina: 6,
  cabeca: { inclina: 20, gira: 22 },
  // ABRIR, NÃO BALANÇAR. Com o corpo tombado, o eixo frente-trás virou o
  // vertical: um braço "aberto" com `balanco` fica apontando para o céu, que
  // foi exatamente como este morto saiu na primeira tentativa — pés a 0,554
  // de altura e nariz a 0,042. Membro aberto de quem está no chão é `abre`.
  bracoD: { balanco: -8, abre: 76, dobra: 10 },
  bracoE: { balanco: 6, abre: 68, dobra: 6 },
  pernaD: { balanco: -4, abre: 34, dobra: -10 },
  pernaE: { balanco: 6, abre: 40, dobra: -6 },
};

/**
 * A BIBLIOTECA. Mesmos nomes e mesmas contagens de `sheet.js`, para a migração
 * ser uma troca e não uma tradução.
 */
export const ANIMACOES = {
  idle:   { quadros: 2, pose: (i) => parado(i === 1) },
  walk:   { quadros: 4, pose: andar },
  attack: { quadros: 2, pose: (i) => ATAQUE[i] },
  hurt:   { quadros: 1, pose: () => DANO },
  down:   { quadros: 1, pose: () => CAIDO },
  sleep:  { quadros: 2, pose: (i) => dormindo(i === 1) },
  dead:   { quadros: 1, pose: () => MORTO },
};

/** Todos os quadros, achatados — serve à bancada e à folha. */
export function todosOsQuadros() {
  const fora = [];
  for (const [nome, a] of Object.entries(ANIMACOES)) {
    for (let i = 0; i < a.quadros; i++) fora.push({ nome, quadro: i, pose: a.pose(i) });
  }
  return fora;
}
