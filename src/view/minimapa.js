// Minimapa.
//
// POR QUE EXISTE
// O tabuleiro é isométrico, gira e tem zoom. São três boas qualidades que
// custam a mesma coisa: com a câmera torta, "quem está onde" deixa de ser
// óbvio. O minimapa é a vista de cima, sem rotação e sem zoom — a única
// projeção em que o mapa inteiro cabe de uma vez e o norte é sempre o mesmo.
//
// E ele mora na coluna do log, que passava a maior parte da partida vazia:
// duas linhas de texto e um aviso de licença ocupando trezentos pixels de
// largura.
//
// POR QUE NÃO GIRA JUNTO COM A CÂMERA
// Porque seria o mesmo problema outra vez. Um mapa de referência que muda de
// orientação não é referência. O tabuleiro gira; isto não.
//
// DESENHO EM CANVAS, e não em divs, porque são 16×12 células redesenhadas a
// cada evento do motor — 192 nós de DOM reconstruídos por turno para mostrar
// pontinhos é desperdício que aparece no quadro a quadro.

const CORES = {
  chao: '#6f6350',
  parede: '#2e2619',
  dificil: '#4d6b5a',
  cobertura: '#7d6035',
  grade: 'rgba(40, 28, 12, .25)',
  grupo: '#2c6a9e',
  grupoSel: '#8fd5ff',
  inimigo: '#a83420',
  caido: '#6b5a3f',
  moldura: '#75501a',
};

// As superfícies do mapa da estrada. Sem isto o minimapa pintaria a mata de
// cinza-parede e a estrada da mesma cor da grama — e um mapa pequeno que
// discorda do grande é pior do que nenhum. A grama elevada clareia, como o
// platô do mapa padrão, para o barranco aparecer também aqui.
const CORES_SUP = {
  estrada: '#a08a64',
  grama: '#5e7a46',
  gramaAlta: '#71904f',
  arvore: '#2f4a2c',
  carroca: '#6b4a2c',
  cavalo: '#3d3540',
  pedra: '#77787f',
  arbusto: '#3d6338',
  // Árvore Trovão: o que a vila soterrada tem de chão.
  lago: '#3f6a86',
  margem: '#b3a67a',
  trigo: '#b39d5c',
  cinza: '#7c776c',
  teia: '#c9c7bd',
  lajeRuina: '#77716a',
  lajeEntulho: '#6a645c',
  tabua: '#7a5d3a',
};

/** Altura vira clareamento: o platô fica mais claro que o chão à volta. */
function corDaCelula(field, x, y) {
  const sup = field.surfaceAt?.(x, y);
  if (sup === 'grama' && field.heightAt(x, y) > 0) return CORES_SUP.gramaAlta;
  if (CORES_SUP[sup]) return CORES_SUP[sup];
  const t = field.tileAt(x, y);
  if (t === 1) return CORES.parede;
  if (t === 2) return CORES.dificil;
  if (t === 3) return CORES.cobertura;
  const h = field.heightAt(x, y);
  if (!h) return CORES.chao;
  // Cada nível soma um passo de claro. Três níveis é o teto deste mapa.
  const n = Math.min(3, h);
  return ['#6f6350', '#7d7059', '#8a7c63', '#99896e'][n] ?? CORES.chao;
}

export function criarMinimapa(root) {
  const caixa = document.createElement('div');
  caixa.className = 'minimapa';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Mapa';

  const canvas = document.createElement('canvas');
  canvas.className = 'minimapa-tela';
  const ctx = canvas.getContext('2d');

  caixa.append(titulo, canvas);
  root.append(caixa);

  let lado = 12; // pixels por célula, recalculado no primeiro desenho

  function desenhar(enc, selecionado) {
    if (!enc?.field) return;
    const { w, h } = enc.field;

    // O lado da célula sai da largura disponível, em número INTEIRO: meia
    // célula esticada deixaria a grade com linhas de espessura diferente.
    const largura = caixa.clientWidth || 280;
    lado = Math.max(4, Math.floor(largura / w));
    const cw = lado * w;
    const ch = lado * h;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        ctx.fillStyle = corDaCelula(enc.field, x, y);
        ctx.fillRect(x * lado, y * lado, lado, lado);
      }
    }

    // Grade por cima, fina: dá a contagem de quadrados sem roubar a leitura.
    if (lado >= 7) {
      ctx.strokeStyle = CORES.grade;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < w; x++) { ctx.moveTo(x * lado + .5, 0); ctx.lineTo(x * lado + .5, ch); }
      for (let y = 1; y < h; y++) { ctx.moveTo(0, y * lado + .5); ctx.lineTo(cw, y * lado + .5); }
      ctx.stroke();
    }

    // As criaturas. A PEGADA importa: um ogro ocupa 2×2 e o minimapa mente
    // se o desenhar do tamanho de um goblin.
    for (const c of enc.combatants) {
      if (c.dead) continue;
      const caido = c.hp <= 0;
      const pegada = c.pos.f ?? 1;
      const px = c.pos.x * lado;
      const py = c.pos.y * lado;
      const tam = lado * pegada;

      ctx.fillStyle = caido
        ? CORES.caido
        : c.side === 'party'
          ? (c === selecionado ? CORES.grupoSel : CORES.grupo)
          : CORES.inimigo;
      ctx.fillRect(px + 1, py + 1, Math.max(2, tam - 2), Math.max(2, tam - 2));

      if (c === selecionado) {
        ctx.strokeStyle = '#fff6df';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + .5, py + .5, tam - 1, tam - 1);
      }
    }

    ctx.strokeStyle = CORES.moldura;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cw - 2, ch - 2);
  }

  return { node: caixa, desenhar };
}
