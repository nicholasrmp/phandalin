// Teste de silhueta, de escala e de transbordo da célula — sem navegador.
//
// POR QUE EXISTE
// A regra do ELENCO — "se a frase da silhueta servir para outra criatura, você
// não resolveu" — era uma promessa escrita em comentário. Promessa em
// comentário não segura nada: duas rodadas atrás, lobo e lobo atroz saíram
// PIXEL A PIXEL idênticos, e os quatro espectros também, e dois autores
// entregaram a colisão documentada em prosa esperando que alguém lesse.
//
// Isto transforma a promessa em medida. O truque é que `kit.js` só usa
// `fillStyle`, `fillRect` e `clearRect` — então um contexto de mentira de
// trinta linhas basta para rodar o pintor inteiro fora do navegador.
//
//   node src/dev/silhueta.js          relatório completo
//   node src/dev/silhueta.js --falhar sai com código 1 se houver falha
//
// Mede três coisas:
//   ESCALA     altura do contorno contra o que a anatomia ou a categoria pede
//   TRANSBORDO sprite que escreve na borda e suja o quadrado vizinho na folha
//   COLISÃO    IoU par a par entre todas as figuras, nas três vistas

import { paint, GROUND } from '../art/draw.js';
import { metrics } from '../art/body.js';
import { LOOKS } from '../art/looks.js';
import { MONSTERS } from '../rules/monsters.js';

const CELL_W = 52;
const CELL_H = 80;
const VISTAS = ['front', 'side', 'back'];
const POSE = { kind: 'idle', frame: 0 };

/**
 * Faixas de ELENCO.md §3: valem para quem fica EM PÉ.
 *
 * Medir bicho de quatro patas por altura é errado e a primeira versão desta
 * ferramenta errou assim: acusava o lobo de baixo, e lobo é baixo mesmo — ele
 * é comprido. Para quem não é bípede o que importa é a PEGADA, o maior lado da
 * caixa, porque é ela que diz quanto chão a criatura ocupa, que é o que a
 * categoria de tamanho significa.
 */
const FAIXAS = {
  miúdo: [14, 24], miudo: [14, 24],
  pequeno: [38, 45],
  médio: [52, 66], medio: [52, 66],
  grande: [66, 75],
};

const FAIXAS_PEGADA = {
  // Com folga: estas faixas são invenção do projeto, não medida de nada. Errar
  // por 3 px não é defeito; sair da categoria é.
  miúdo: [12, 34], miudo: [12, 34],
  pequeno: [26, 46],
  médio: [40, 66], medio: [40, 66],
  grande: [56, 78],
};

/** Armas verticais sobem legitimamente acima da cabeça. */
const ARMA_ALTA = new Set(['staff', 'bow', 'lanca', 'alabarda']);

/** Colisões aceitas, com o motivo. Qualquer outra acima do limiar é falha. */
const TOLERADAS = [
  // O doppelganger disfarçado DEVE passar por um plebeu: é a criatura inteira.
  ['plebeu', 'doppelganger'],
];
const LIMIAR = 0.93;

// ---------------------------------------------------------------------------

/** Contexto de mentira: guarda só a máscara de alfa. */
function contextoFalso() {
  const mask = new Uint8Array(CELL_W * CELL_H);
  return {
    mask,
    fillStyle: '#000',
    fillRect(x, y, w, h) {
      for (let j = Math.max(0, Math.floor(y)); j < Math.min(CELL_H, Math.ceil(y + h)); j++) {
        for (let i = Math.max(0, Math.floor(x)); i < Math.min(CELL_W, Math.ceil(x + w)); i++) {
          mask[j * CELL_W + i] = 1;
        }
      }
    },
    clearRect(x, y, w, h) {
      for (let j = Math.max(0, Math.floor(y)); j < Math.min(CELL_H, Math.ceil(y + h)); j++) {
        for (let i = Math.max(0, Math.floor(x)); i < Math.min(CELL_W, Math.ceil(x + w)); i++) {
          mask[j * CELL_W + i] = 0;
        }
      }
    },
  };
}

function render(look, dir) {
  const ctx = contextoFalso();
  try {
    paint(ctx, 0, 0, CELL_W, CELL_H, look, dir, POSE);
  } catch (e) {
    return { erro: e.message, mask: ctx.mask, caixa: null };
  }
  let x0 = CELL_W; let y0 = CELL_H; let x1 = -1; let y1 = -1; let acesos = 0;
  for (let y = 0; y < CELL_H; y++) {
    for (let x = 0; x < CELL_W; x++) {
      if (!ctx.mask[y * CELL_W + x]) continue;
      acesos += 1;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const caixa = x1 < 0 ? null : { x0, y0, x1, y1, alt: y1 - y0 + 1, larg: x1 - x0 + 1, acesos };
  return { erro: null, mask: ctx.mask, caixa };
}

function iou(a, b) {
  let inter = 0; let uniao = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) uniao += 1;
    if (a[i] && b[i]) inter += 1;
  }
  return uniao ? inter / uniao : 1;
}

/**
 * Quanto a figura deveria medir, e QUAL medida olhar.
 *
 * Bípede: a altura, contra o que a anatomia de `body.js` pede. A folga é
 * assimétrica porque encolher é postura — o ladino e o goblin agacham — e
 * crescer é a marca de silhueta comendo altura, que foi o que fez um hobgoblin
 * Médio sair mais alto que um ogro Grande. Quem segura cajado ou arco ganha
 * folga extra para cima: a haste sobe acima da cabeça de propósito, é a marca
 * dele, e isso não é defeito.
 *
 * Quem não fica em pé: a pegada, contra a categoria de tamanho.
 */
function alvoDe(look, size) {
  if (!look.plan && !look.quadruped) {
    try {
      const t = metrics(look).total;
      const folga = ARMA_ALTA.has(look.weapon) ? 14 : 4;
      return { medida: 'alt', min: t - 7, max: t + folga, texto: `anatomia pede ${t}` };
    } catch { /* cai na faixa */ }
  }
  const f = FAIXAS_PEGADA[size];
  return f ? { medida: 'pegada', min: f[0], max: f[1], texto: `pegada de ${size} pede ${f[0]}–${f[1]}` } : null;
}

// ---------------------------------------------------------------------------

const tamanhoPorLook = new Map();
for (const def of Object.values(MONSTERS)) if (def.look) tamanhoPorLook.set(def.look, def.size ?? 'médio');

const figuras = [];
const falhas = [];

for (const [chave, look] of Object.entries(LOOKS)) {
  const vistas = {};
  for (const dir of VISTAS) vistas[dir] = render(look, dir);

  const erro = VISTAS.map((d) => vistas[d].erro).find(Boolean);
  if (erro) {
    falhas.push(`ERRO   ${chave}: ${erro}`);
    continue;
  }

  const alt = Math.max(...VISTAS.map((d) => vistas[d].caixa?.alt ?? 0));
  const pegada = Math.max(...VISTAS.map((d) => Math.max(vistas[d].caixa?.alt ?? 0, vistas[d].caixa?.larg ?? 0)));
  const size = tamanhoPorLook.get(chave) ?? 'médio';
  const alvo = alvoDe(look, size);
  const medido = alvo?.medida === 'pegada' ? pegada : alt;
  if (alvo && medido && (medido < alvo.min || medido > alvo.max)) {
    falhas.push(`ESCALA ${chave}: ${alvo.texto} px, está com ${medido}`);
  }

  for (const dir of VISTAS) {
    const c = vistas[dir].caixa;
    if (!c) continue;
    // Passar um pouco da linha do chão é aceitável — uma cauda pousada à
    // frente dos pés lê bem no isométrico. O que não pode é não sobrar linha
    // para o contorno automático, aí o sprite encosta no vizinho da folha.
    if (c.x0 <= 0 || c.x1 >= CELL_W - 1 || c.y0 <= 0 || c.y1 >= CELL_H - 1) {
      falhas.push(`BORDA  ${chave} (${dir}): caixa ${c.x0}..${c.x1} x ${c.y0}..${c.y1}`);
    }
  }

  figuras.push({ chave, vistas, alt });
}

// --- colisões ---------------------------------------------------------------
const tolerado = new Set(TOLERADAS.map((p) => p.slice().sort().join('|')));
const colisoes = [];
for (let i = 0; i < figuras.length; i++) {
  for (let j = i + 1; j < figuras.length; j++) {
    const a = figuras[i];
    const b = figuras[j];
    if (tolerado.has([a.chave, b.chave].sort().join('|'))) continue;
    const pior = Math.max(...VISTAS.map((d) => iou(a.vistas[d].mask, b.vistas[d].mask)));
    if (pior >= LIMIAR) colisoes.push({ a: a.chave, b: b.chave, iou: pior });
  }
}
colisoes.sort((x, y) => y.iou - x.iou);
for (const c of colisoes) {
  falhas.push(`COLISÃO ${c.a} × ${c.b}: IoU ${c.iou.toFixed(3)} (limiar ${LIMIAR})`);
}

// --- relatório ---------------------------------------------------------------
console.log(`${figuras.length} figuras medidas, ${VISTAS.length} vistas cada.`);
console.log(`${falhas.length} falha(s).\n`);
for (const f of falhas) console.log(' ' + f);
if (!falhas.length) console.log(' tudo dentro do contrato.');

if (process.argv.includes('--falhar') && falhas.length) process.exit(1);
