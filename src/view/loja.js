// A tela de uma loja da vila: comprar e vender, herói a herói.
//
// A regra mora em `game/comercio.js`; aqui só se mostra e se clica. O dinheiro
// é do grupo (a compra sai de todos os bolsos), mas o item vai para alguém —
// e é esse alguém que se escolhe no topo, porque a cota de malha na mochila
// do mago não serve para nada.

import './loja.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { makePortrait } from '../art/sheet.js';
import { iconeDeItem } from './ficha.js';
import {
  totalEmCobre, moedas, comprar, vender, vendaveis, motivoParaNaoComprar, avisoDeTreino,
} from '../game/comercio.js';

function retrato(look, lado) {
  try {
    const cv = makePortrait(look, lado);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span');
  }
}

/** O que a coisa faz, numa linha: é o que decide a compra. */
function oQueFaz(l) {
  const d = l.dados;
  if (l.tipo === 'arma') {
    const alcance = d.rangeFt ? ` · ${d.rangeFt}/${d.longRangeFt} pés` : '';
    return `${d.damage} ${d.type}${alcance}${d.props?.length ? ` · ${d.props.join(', ')}` : ''}`;
  }
  if (l.tipo === 'armadura') {
    const des = d.dexCap === Infinity ? '+ Des' : d.dexCap ? `+ Des até ${d.dexCap}` : 'sem Des';
    const extra = [d.forcaMinima && `For ${d.forcaMinima}`, d.furtividade && 'desvantagem em Furtividade'].filter(Boolean).join(' · ');
    return `CA ${d.base} ${des} · armadura ${d.categoria}${extra ? ` · ${extra}` : ''}`;
  }
  if (l.tipo === 'escudo') return `+${d.ac} de CA · ocupa uma mão`;
  return d.desc ?? '';
}

const GRUPOS = {
  arma: 'Armas', armadura: 'Armaduras', escudo: 'Armaduras', item: 'Equipamento',
};

/**
 * Abre a loja e resolve quando o jogador fecha.
 * @param {HTMLElement} root
 * @param {{ loja: object, npc: {name: string, look: string}, grupo: object[], aoMudar?: (t: string) => void,
 *           onFicha?: (heroi: object, depois: () => void) => void }} o
 */
// A PORTA DA LOJA (sala, F6.4). Numa partida de sala o anfitrião a põe aqui: a loja que a cena abre passa a ser aberta para TODOS
// os jogadores (cada um compra e vende para o seu herói). Sem porta, é a tela de sempre.
let portaDaLoja = null;
export const definirPortaDaLoja = (p = null) => { portaDaLoja = p; };
export const abrirLoja = (root, o) => (portaDaLoja ? portaDaLoja(root, o) : abrirLojaLocal(root, o));

/**
 * `podeUsar(c)`: quais heróis ESTE jogador pode escolher (o dinheiro continua sendo do grupo todo); `acoes`: no lugar de mexer nos
 * heróis daqui, pede ao anfitrião (`{ comprar(heroi, l), vender(heroi, v) }`, devolvendo `{ ok: true, pendente: true }`); `ligar`
 * recebe `{ desenhar, fechar }` para a tela de fora redesenhar quando o anfitrião responde.
 */
export function abrirLojaLocal(root, { loja, npc, grupo, aoMudar, onFicha, podeUsar = () => true, acoes = null, ligar = null }) {
  return new Promise((resolve) => {
    const todos = () => grupo.filter((c) => !c.dead);
    const vivos = () => todos().filter(podeUsar);
    const podeComprar = loja.estoque().length > 0;
    let aba = podeComprar ? 'comprar' : 'vender';
    let heroi = vivos()[0];
    let filtro = '';
    let aviso = '';

    const dinheiro = el('span', { class: 'loja-dinheiro' });
    const fala = el('p', { class: 'loja-fala' });
    const herois = el('div', { class: 'loja-herois' });
    const abas = el('div', { class: 'loja-abas' });
    const busca = el('input', {
      class: 'loja-busca', type: 'search', placeholder: 'Procurar…',
      oninput: (e) => { filtro = e.target.value.trim().toLowerCase(); desenharLista(); },
    });
    const lista = el('div', { class: 'loja-lista' });
    const rodape = el('div', { class: 'loja-rodape' });

    function fechar() {
      document.removeEventListener('keydown', teclas);
      caixa.remove();
      resolve();
    }
    const teclas = (e) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', teclas);

    const caixa = el('div', { class: 'loja', role: 'dialog', 'aria-label': loja.nome },
      el('div', { class: 'loja-caixa' },
        el('header', { class: 'loja-topo' },
          el('span', { class: 'loja-retrato' }, retrato(npc.look, 56)),
          el('div', {}, el('h3', {}, loja.nome), el('small', {}, npc.name), fala),
          el('div', { class: 'loja-bolsa' }, el('small', {}, 'Dinheiro do grupo'), dinheiro),
          el('button', { class: 'vila-btn', onclick: fechar }, 'Fechar')),
        abas, herois,
        el('div', { class: 'loja-ferramentas' }, busca),
        lista, rodape));

    function desenharTopo() {
      dinheiro.textContent = moedas(totalEmCobre(todos()));
      fala.textContent = `— ${loja.fala[aba] ?? ''}`;
      abas.replaceChildren(...['comprar', 'vender']
        .filter((a) => a === 'vender' || podeComprar)
        .map((a) => el('button', {
          class: `loja-aba${aba === a ? ' ativa' : ''}`,
          onclick: () => { aba = a; aviso = ''; desenhar(); },
        }, a === 'comprar' ? 'Comprar' : 'Vender')));
      herois.replaceChildren(...[el('small', {}, aba === 'comprar' ? 'Para quem:' : 'Quem vende:'),
        ...vivos().map((c) => el('button', {
          class: `loja-heroi${c === heroi ? ' ativo' : ''}`,
          title: c.name,
          onclick: () => { heroi = c; aviso = ''; desenhar(); },
        }, el('span', { class: 'loja-heroi-retrato' }, retrato(c.look, 28)), c.name)),
        onFicha ? el('button', {
          class: 'vila-btn discreto loja-ficha', title: 'Vestir o que comprou, ou guardar para vender',
          onclick: () => onFicha(heroi, desenhar),
        }, `Ficha de ${heroi.name}`) : null].filter(Boolean));
      rodape.textContent = aviso;
    }

    const confere = (l) => !filtro || l.dados.name.toLowerCase().includes(filtro);

    function linhaDeCompra(l) {
      const motivo = motivoParaNaoComprar(heroi, l, todos());
      const treino = avisoDeTreino(heroi, l);
      return el('div', { class: 'loja-item' },
        el('span', { class: 'loja-icone' }, iconeDeItem(l.id, 32)),
        el('div', { class: 'loja-desc' },
          el('strong', {}, l.lote > 1 ? `${l.dados.name} (${l.lote})` : l.dados.name),
          el('small', {}, oQueFaz(l)),
          treino ? el('small', { class: 'loja-alerta' }, treino) : null),
        el('span', { class: 'loja-preco' }, moedas(l.preco)),
        el('button', {
          class: 'vila-btn', disabled: motivo ? true : false, title: motivo ?? `Comprar para ${heroi.name}`,
          onclick: () => {
            const r = (acoes?.comprar ?? comprar)(heroi, l, todos());
            if (!r.ok) { aviso = r.why; desenhar(); return; }
            if (r.pendente) { aviso = `Pedido enviado: ${heroi.name} leva ${l.dados.name}.`; desenhar(); return; }
            audio.play('coin');
            aviso = `${heroi.name} leva ${l.lote > 1 ? `${l.lote} ` : ''}${l.dados.name} por ${moedas(l.preco)}.`;
            aoMudar?.(aviso);
            desenhar();
          },
        }, 'Comprar'));
    }

    function linhaDeVenda(v) {
      return el('div', { class: 'loja-item' },
        el('span', { class: 'loja-icone' }, iconeDeItem(v.id, 32)),
        el('div', { class: 'loja-desc' },
          el('strong', {}, `${v.dados.name}${v.qtd > 1 ? ` ×${v.qtd}` : ''}`),
          el('small', {}, v.lote > 1 ? `vende-se em lote de ${v.lote}` : oQueFaz(v))),
        el('span', { class: 'loja-preco' }, moedas(v.paga)),
        el('button', {
          class: 'vila-btn',
          onclick: () => {
            const r = (acoes?.vender ?? vender)(heroi, v);
            if (!r.ok) { aviso = r.why; desenhar(); return; }
            if (r.pendente) { aviso = `Pedido enviado: ${heroi.name} vende ${v.dados.name}.`; desenhar(); return; }
            audio.play('coin');
            aviso = `${heroi.name} vende ${v.lote > 1 ? `${v.lote} ` : ''}${v.dados.name} por ${moedas(v.paga)}.`;
            aoMudar?.(aviso);
            desenhar();
          },
        }, 'Vender'));
    }

    function desenharLista() {
      if (aba === 'comprar') {
        const itens = loja.estoque().filter(confere);
        const blocos = [];
        let grupoAtual = null;
        for (const l of itens) {
          const g = GRUPOS[l.tipo];
          if (g !== grupoAtual) { blocos.push(el('h4', {}, g)); grupoAtual = g; }
          blocos.push(linhaDeCompra(l));
        }
        lista.replaceChildren(...(blocos.length ? blocos : [el('p', { class: 'loja-vazio' }, 'Nada com esse nome.')]));
      } else {
        const itens = vendaveis(heroi, loja).filter(confere);
        lista.replaceChildren(...(itens.length
          ? itens.map(linhaDeVenda)
          : [el('p', { class: 'loja-vazio' }, `${heroi.name} não tem nada que interesse aqui. Arma na mão e armadura vestida não se vendem: guarde primeiro, pela ficha.`)]));
      }
    }

    function desenhar() {
      if (!heroi || heroi.dead) heroi = vivos()[0];
      desenharTopo();
      desenharLista();
    }

    root.append(caixa);
    desenhar();
    busca.focus();
    ligar?.({ desenhar, fechar });
  });
}
