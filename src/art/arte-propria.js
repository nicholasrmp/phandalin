// A ARTE PRÓPRIA do herói criado pelo jogador (`game/criador.js`): a imagem que ele mandou, já reduzida, registrada
// por uma chave de look `arte:<id>`. `sheet.js makePortrait` reconhece a chave e desenha o retrato a partir dela, e
// por isso toda tela que pede um retrato (o painel, a barra de ações, a ficha, o tabuleiro) funciona sem saber que o
// herói não tem folha de sprites.
//
// É o anel dinâmico do Foundry pela metade que importa: o jogador manda só a ARTE; o anel e o fundo são do jogo, na
// cor do lado (`tabuleiro-topo.js ficha`). Sem imagem, o retrato é a inicial do nome sobre um disco.

const ARTES = new Map();   // chave → { img, nome }

/** A chave é de arte própria? (`arte:pc-criado-x`, com ou sem estado: `arte:pc-criado-x~furia`). */
export const ehArte = (look) => String(look ?? '').startsWith('arte:');
const semEstado = (look) => String(look ?? '').split('~')[0];

/** Registra (ou troca) a arte de uma chave. `url` pode ser nulo: o retrato vira a inicial do nome. */
export function registrarArte(chave, url, nome = '') {
  const k = semEstado(chave);
  const atual = ARTES.get(k);
  if (atual && atual.url === url && atual.nome === nome) return;
  let img = null;
  if (url && typeof Image !== 'undefined') {
    img = new Image();
    img.src = url;
  }
  ARTES.set(k, { url, img, nome, esperando: [] });
  if (img) img.addEventListener('load', () => { for (const f of ARTES.get(k)?.esperando ?? []) f(); });
}

/** A imagem da arte, já carregada; `null` enquanto carrega ou se não há. */
export function imagemDaArte(chave) {
  const a = ARTES.get(semEstado(chave));
  return a?.img?.complete && a.img.naturalWidth ? a.img : null;
}

/**
 * Desenha o retrato da arte num canvas `p`×`p` (já criado por quem chama). A imagem é recortada em quadrado pelo
 * centro; se ainda não carregou, desenha a inicial e troca pela imagem quando ela chegar.
 */
export function pintarArte(canvas, chave) {
  const a = ARTES.get(semEstado(chave));
  const ctx = canvas.getContext('2d');
  const p = canvas.width;
  const inicial = () => {
    ctx.clearRect(0, 0, p, p);
    ctx.fillStyle = '#3b3326';
    ctx.fillRect(0, 0, p, p);
    ctx.fillStyle = '#e9dcbc';
    ctx.font = `600 ${Math.round(p * 0.5)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(([...(a?.nome ?? '?')][0] ?? '?').toUpperCase(), p / 2, p * 0.54);
  };
  const imagem = () => {
    const img = a.img;
    const lado = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.clearRect(0, 0, p, p);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, p, p);
  };
  canvas.style.imageRendering = 'auto';
  if (imagemDaArte(chave)) { imagem(); return; }
  inicial();
  if (a?.img) a.esperando.push(imagem);
}
