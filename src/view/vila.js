// A tela da vila (Phandalin): o mapa com os lugares, o grupo, a hora do dia,
// o dinheiro e o diário de missões. Clicar num lugar abre a cena dele
// (`game/phandalin.js`).
//
// O MAPA é a pintura da vila (OpenArt, `art/vila/phandalin.webp`), fora do
// tabuleiro como combinado. Os marcadores ficam em % dela, por cima.

import './vila.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { makePortrait } from '../art/sheet.js';
import pintura from '../art/vila/phandalin.webp';
import { moedas } from '../game/comercio.js';

function retrato(look) {
  try {
    const cv = makePortrait(look, 36);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span');
  }
}

export function abrirTelaVila(root, o) {
  const pinos = new Map();
  const log = el('ol', { class: 'vila-log' });
  const momento = el('span', { class: 'vila-momento' });
  const dinheiro = el('span', { class: 'vila-dinheiro' });
  const grupo = el('div', { class: 'vila-grupo' });

  // A pintura e os marcadores dentro de uma moldura com a proporção dela, para
  // a % dos marcadores cair sempre no mesmo prédio, qualquer que seja a tela.
  const quadro = el('div', { class: 'vila-quadro', style: { backgroundImage: `url(${pintura})` } });
  const mapa = el('div', { class: 'vila-mapa' }, quadro);
  for (const l of o.lugares) {
    const b = el('button', {
      class: 'vila-pino',
      style: { left: `${l.x}%`, top: `${l.y}%` },
      title: l.nome,
      onclick: () => { audio.play('click'); o.onLugar(l); },
    }, el('i'), el('span', {}, l.nome));
    pinos.set(l.id, b);
    quadro.append(b);
  }

  const diario = el('div', { class: 'vila-diario', hidden: true });
  const abrirDiario = () => {
    const ativas = Object.entries(o.estado.missoes);
    diario.replaceChildren(
      el('h3', {}, 'Diário'),
      el('h4', {}, 'Missões'),
      ativas.length
        ? el('ul', {}, ...ativas.map(([id, est]) => el('li', { class: est === 'feita' ? 'feita' : '' },
          el('strong', {}, o.missoes[id].titulo), el('small', {}, ` — de ${o.missoes[id].de}${o.missoes[id].recompensa ? ` · ${o.missoes[id].recompensa}` : ''}`),
          el('p', {}, o.missoes[id].texto))))
        : el('p', {}, 'Nenhuma ainda.'),
      ...(o.grupo.some((c) => c.faccao) ? [el('h4', {}, 'Facções'),
        el('ul', {}, ...o.grupo.filter((c) => c.faccao).map((c) => el('li', {}, el('strong', {}, c.name), ` — ${c.titulo}`)))] : []),
      el('h4', {}, 'Pistas'),
      o.estado.pistas.length ? el('ul', {}, ...o.estado.pistas.map((p) => el('li', {}, p))) : el('p', {}, 'Nenhuma ainda.'),
      el('button', { class: 'vila-btn', onclick: () => { diario.hidden = true; } }, 'Fechar'));
    diario.hidden = false;
  };

  const caixa = el('div', { class: 'vila' },
    el('header', { class: 'vila-topo' },
      el('h2', {}, 'Phandalin'), momento, dinheiro,
      el('div', { class: 'vila-acoes' },
        el('button', { class: 'vila-btn', onclick: abrirDiario }, 'Diário'),
        el('button', { class: 'vila-btn', title: 'Ficha e inventário (vestir, guardar)', onclick: () => o.onFicha?.(o.grupo.find((c) => !c.dead)) }, 'Ficha'),
        el('button', { class: 'vila-btn', onclick: () => o.onDormir() }, 'Dormir'),
        el('button', { class: 'vila-btn discreto', onclick: () => o.onMenu() }, 'Menu'))),
    el('div', { class: 'vila-corpo' }, mapa, el('aside', { class: 'vila-lado' }, grupo, log)),
    diario);
  root.append(caixa);
  for (const t of o.estado.registro ?? []) log.prepend(el('li', {}, t));

  function atualizar() {
    momento.textContent = o.momento();
    dinheiro.textContent = moedas(o.dinheiro());
    for (const l of o.lugares) {
      pinos.get(l.id).classList.toggle('fechado', !o.aberto(l));
      pinos.get(l.id).classList.toggle('novidade', Boolean(o.novidade?.(l)));
    }
    grupo.replaceChildren(...o.grupo.filter((c) => !c.dead).map((c) => el('button', {
      class: 'vila-heroi', title: `Ficha de ${c.name}`, onclick: () => o.onFicha?.(c),
    },
      el('span', { class: 'vila-retrato' }, retrato(c.look)),
      el('div', {},
        el('strong', {}, c.name),
        el('small', {}, `${c.className ?? ''} · nível ${c.level ?? 1}${c.titulo ? ` · ${c.titulo}` : ''}`),
        el('div', { class: 'vila-vida' }, el('i', { style: { width: `${Math.round(Math.max(0, c.hp) / c.maxHp * 100)}%` } }), el('span', {}, `${Math.max(0, c.hp)}/${c.maxHp}`))))));
  }

  return {
    atualizar,
    // O registro vive no estado da vila: sobrevive à ida e volta das lutas.
    registrar: (t) => {
      (o.estado.registro ??= []).push(t);
      if (o.estado.registro.length > 30) o.estado.registro.shift();
      log.prepend(el('li', {}, t));
      while (log.children.length > 30) log.lastChild.remove();
    },
    // Durante uma cena a vila fica ATRÁS, escurecida e inerte: some só ao
    // fechar. Esconder de vez deixava à mostra o tabuleiro da última luta.
    esconder: () => { caixa.inert = true; caixa.classList.add('em-cena'); },
    mostrar: () => { caixa.inert = false; caixa.classList.remove('em-cena'); },
    fechar: () => caixa.remove(),
    get aberta() { return caixa.isConnected && !caixa.inert; },
  };
}
