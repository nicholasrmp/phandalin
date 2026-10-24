// O menu do botão direito: um painel de latão ao lado do clique, com as
// ações possíveis sobre aquela casa — inspecionar, atacar, conjurar, usar
// item, conversar. Quem decide QUAIS ações é `game/interacoes.js`; aqui só se
// desenha e se escolhe.
//
// A PEÇA. Usa as mesmas peças de arte do HUD (`src/art/hud/`): a moldura de
// latão das colunas, o encaixe de madeira do retrato e o soquete dos ícones
// da barra de ações. Fora delas, nada: a janela tem de parecer parte do
// jogo, não um menu do navegador.
//
//   cabeçalho  retrato (ou ícone, para objeto), nome, estado, barra de vida
//              (do aliado com o número; do inimigo só a cor e a palavra) e
//              etiquetas (classe, CA, distância)
//   ações      ícone no soquete, nome, conta curta e a chance numa pílula —
//              verde boa, âmbar média, vermelha ruim. Os números 1 a 9 do
//              teclado escolhem; setas e Enter também andam
//   recusa     opção que não vale agora fica em cinza COM o motivo ("fora de
//              alcance — 40 pés"): esconder a deixaria sem explicação
//
// Passar o mouse numa ação chama `aoPrevia(opcao)`, para o tabuleiro acender
// o alvo dela; sair chama `aoPrevia(null)`.

import './menu-contexto.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { iconCanvas, temIcone } from '../art/icons.js';
import { makePortrait } from '../art/sheet.js';

let atual = null;

function fechar() {
  if (!atual) return;
  atual.aoPrevia?.(null);
  atual.caixa.remove();
  removeEventListener('pointerdown', atual.fora, true);
  removeEventListener('keydown', atual.tecla, true);
  atual = null;
}

export const menuContextoAberto = () => Boolean(atual);

function icone(nome, lado = 32) {
  if (!nome || !temIcone(nome)) return el('span', { class: 'menu-ctx-sem-icone' });
  try {
    const cv = iconCanvas(nome, lado);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span', { class: 'menu-ctx-sem-icone' });
  }
}

function retrato(look) {
  try {
    const cv = makePortrait(look, 36);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span', { class: 'menu-ctx-sem-icone' });
  }
}

/** A cor da chance: o que o olho precisa saber antes de ler o número. */
const faixa = (p) => (p == null ? '' : p >= 0.65 ? 'boa' : p >= 0.4 ? 'media' : 'ruim');

function cabecalho({ titulo, subtitulo, alvo }) {
  const a = alvo ?? {};
  const vida = a.vida;
  const frac = vida ? Math.max(0, Math.min(1, vida.atual / vida.max)) : null;
  return el('header', { class: 'menu-ctx-alvo' },
    el('span', { class: 'menu-ctx-retrato' }, a.look ? retrato(a.look) : icone(a.icone)),
    el('div', { class: 'menu-ctx-quem' },
      el('div', { class: 'menu-ctx-nome' },
        el('strong', {}, titulo),
        a.estado && el('span', { class: `menu-ctx-estado ${a.lado ?? ''}` }, a.estado)),
      vida && el('div', { class: `menu-ctx-vida ${a.lado ?? ''}`, title: vida.numero ? `${vida.atual} de ${vida.max} PV` : 'pela aparência' },
        el('i', { style: { width: `${Math.round(frac * 100)}%` } }),
        vida.numero && el('span', {}, `${vida.atual}/${vida.max}`)),
      (a.etiquetas?.length || subtitulo) && el('div', { class: 'menu-ctx-etiquetas' },
        ...(a.etiquetas?.length ? a.etiquetas : [subtitulo]).map((t) => el('span', {}, t)))));
}

/**
 * @param {{ x:number, y:number, titulo:string, subtitulo?:string, alvo?:object,
 *           opcoes: object[], aoPrevia?: (o:object|null)=>void }} m
 */
export function abrirMenuContexto(root, { x, y, titulo, subtitulo = null, alvo = null, opcoes, aoPrevia = null }) {
  fechar();
  const caixa = el('div', { class: `menu-ctx lado-${alvo?.lado ?? 'objeto'}`, role: 'menu', 'aria-label': titulo });
  const botoes = [];
  const corpo = el('div', { class: 'menu-ctx-acoes' });
  let grupoAnterior = null;
  let atalho = 0;

  for (const o of opcoes) {
    if (o.grupo && o.grupo !== grupoAnterior) {
      corpo.append(el('div', { class: 'menu-ctx-grupo' }, o.grupo));
      grupoAnterior = o.grupo;
    }
    const tecla = !o.motivo && atalho < 9 ? String(++atalho) : null;
    const b = el('button', {
      class: `menu-ctx-item${o.motivo ? ' recusada' : ''}${o.destaque ? ' destaque' : ''}`,
      role: 'menuitem',
      disabled: Boolean(o.motivo),
      title: o.motivo ?? null,
      'data-tecla': tecla,
      onclick: () => { audio.play('click'); fechar(); o.fazer(); },
      onmouseenter: () => aoPrevia?.(o.motivo ? null : o),
      onfocus: () => aoPrevia?.(o.motivo ? null : o),
    },
    el('span', { class: `menu-ctx-icone${o.circulo ? ` circulo-${o.circulo}` : ''}` }, icone(o.icone)),
    el('span', { class: 'menu-ctx-texto' },
      el('span', { class: 'menu-ctx-rotulo' }, o.rotulo),
      (o.motivo || o.detalhe) && el('small', {}, o.motivo ?? o.detalhe)),
    o.chanceTexto && !o.motivo && el('span', { class: `menu-ctx-chance ${faixa(o.chance)}`, title: 'chance' }, o.chanceTexto),
    tecla && el('kbd', {}, tecla));
    botoes.push(b);
    corpo.append(b);
  }

  caixa.append(cabecalho({ titulo, subtitulo, alvo }), corpo);
  // Fixa e estreita ANTES de medir: se a folha de estilo ainda não valer, a
  // caixa sairia no fluxo da página, larga como a janela, e a conta abaixo a
  // jogaria no canto de cima.
  Object.assign(caixa.style, { position: 'fixed', left: '0px', top: '0px', maxWidth: '280px' });
  caixa.addEventListener('mouseleave', () => aoPrevia?.(null));
  root.append(caixa);

  // Ao lado do cursor, sem tapar o que foi clicado e sem sair da janela: à
  // direita se couber, senão à esquerda. Medido de novo no quadro seguinte e
  // um pouco depois: na primeira abertura a folha de estilo e os ícones podem
  // ainda estar chegando, e a caixa muda de tamanho quando chegam.
  const px = Number.isFinite(x) ? x : innerWidth / 2;
  const py = Number.isFinite(y) ? y : innerHeight / 2;
  const posicionar = () => {
    if (!caixa.isConnected) return;
    const r = caixa.getBoundingClientRect();
    const direita = px + 18 + r.width <= innerWidth - 8;
    const left = direita ? px + 18 : px - 18 - r.width;
    caixa.style.left = `${Math.max(8, Math.min(left, innerWidth - r.width - 8))}px`;
    caixa.style.top = `${Math.max(8, Math.min(py - 24, innerHeight - r.height - 8))}px`;
  };
  posicionar();
  requestAnimationFrame(posicionar);
  setTimeout(posicionar, 120);

  const ativos = () => botoes.filter((b) => !b.disabled);
  const fora = (e) => { if (!caixa.contains(e.target)) fechar(); };
  const tecla = (e) => {
    if (e.key === 'Escape') { e.stopImmediatePropagation(); fechar(); return; }
    const porTecla = botoes.find((b) => b.dataset.tecla === e.key);
    if (porTecla) { e.preventDefault(); e.stopImmediatePropagation(); porTecla.click(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopImmediatePropagation();
      const lista = ativos();
      const i = lista.indexOf(document.activeElement);
      lista[(i + (e.key === 'ArrowDown' ? 1 : lista.length - 1)) % lista.length]?.focus();
    }
  };
  // No próximo tique: o próprio clique que abriu não pode fechar.
  setTimeout(() => {
    if (atual?.caixa !== caixa) return;
    addEventListener('pointerdown', fora, true);
    addEventListener('keydown', tecla, true);
  }, 0);
  atual = { caixa, fora, tecla, aoPrevia };
}

export { fechar as fecharMenuContexto };
