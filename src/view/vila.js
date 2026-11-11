// A tela da vila (Phandalin): o mapa com os lugares, o grupo, a hora do dia,
// o dinheiro e o diário de missões. Clicar num lugar abre a cena dele
// (`game/phandalin.js`).
//
// A mesma tela serve ao mapa da REGIÃO (`game/regiao.js`): outra pintura,
// outra proporção, outro título e outros botões (`o.pintura`, `o.proporcao`,
// `o.titulo`, `o.botoes`).
//
// O MAPA é o OFICIAL quando a arte está no disco (`o.oficial = { url, proporcao }`, e cada lugar com `l.oficial =
// { x, y }` em % dele): o da vila e o da região, do Obelisco, que ficam fora do repositório e da publicação. A tela
// tenta carregar a imagem; carregou, troca o fundo e muda os pinos de lugar. Sem ela, fica a pintura do OpenArt
// (`art/vila/phandalin.webp`, ou `o.pintura`), com os pinos em `l.x`/`l.y`.

import './vila.css';
import { maxHpEfetivo } from '../rules/conditions.js';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { makePortrait } from '../art/sheet.js';
import pintura from '../art/vila/phandalin.webp';
import { moedas } from '../game/comercio.js';
import { diarioDe } from '../game/diario.js';

// A PORTA DA VILA (F6.3). Numa partida de sala o anfitrião a põe aqui: o mapa da vila e o da região (que usa a mesma tela) passam a
// ser VOTAÇÃO: o clique num lugar é um voto, e o grupo vai junto para o mais votado. `escolher(lugar)` recebe o clique;
// `aoAtualizar(instantaneo, api)` entrega o que os outros jogadores veem; `votos()` e `faixa()` dizem como vai a votação.
let portaDaVila = null;
export const definirPortaDaVila = (p = null) => { portaDaVila = p; };

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
  const faixa = el('span', { class: 'vila-votacao' });

  // A pintura e os marcadores dentro de uma moldura com a proporção dela, para
  // a % dos marcadores cair sempre no mesmo prédio, qualquer que seja a tela.
  const quadro = el('div', { class: 'vila-quadro', style: { backgroundImage: `url(${o.pintura ?? pintura})` } });
  // Propriedade personalizada só entra por setProperty.
  if (o.proporcao) quadro.style.setProperty('--proporcao', o.proporcao);
  const mapa = el('div', { class: 'vila-mapa' }, quadro, el('span', { class: 'vila-dica' }, 'Clique num pino para visitar o lugar.'));
  // A ROTA da viagem em curso (`o.rota()`: pontos em % do mapa oficial e quanto já se andou), num SVG por cima da arte
  const NS = 'http://www.w3.org/2000/svg';
  const svgRota = document.createElementNS(NS, 'svg');
  svgRota.setAttribute('class', 'vila-rota');
  svgRota.setAttribute('viewBox', '0 0 100 100');
  svgRota.setAttribute('preserveAspectRatio', 'none');
  function desenharRota() {
    svgRota.replaceChildren();
    const r = noOficial ? o.rota?.() : null;
    if (!r?.pontos?.length) return;
    const linha = document.createElementNS(NS, 'polyline');
    linha.setAttribute('points', r.pontos.map((p) => `${p.x},${p.y}`).join(' '));
    linha.setAttribute('class', 'vila-rota-linha');
    svgRota.append(linha);
    const k = Math.min(r.pontos.length - 1, Math.round(r.feito * (r.pontos.length - 1)));
    const aqui = document.createElementNS(NS, 'circle');
    aqui.setAttribute('cx', r.pontos[k].x);
    aqui.setAttribute('cy', r.pontos[k].y);
    aqui.setAttribute('r', '0.9');
    aqui.setAttribute('class', 'vila-rota-grupo');
    svgRota.append(aqui);
  }
  // o mapa oficial, se estiver no disco: troca a arte e os pinos quando a imagem carrega
  let noOficial = false;
  if (o.oficial?.url) {
    const teste = new Image();
    teste.onload = () => {
      noOficial = true;
      quadro.style.backgroundImage = `url(${o.oficial.url})`;
      quadro.style.setProperty('--proporcao', o.oficial.proporcao);
      quadro.classList.add('oficial');
      for (const l of o.lugares) {
        const pino = pinos.get(l.id);
        if (pino && l.oficial) { pino.style.left = `${l.oficial.x}%`; pino.style.top = `${l.oficial.y}%`; }
      }
      desenharRota();
      o.aoTrocarArte?.();
    };
    teste.src = o.oficial.url;
  }
  for (const l of o.lugares) {
    const b = el('button', {
      class: `vila-pino${l.cidade ? ' cidade' : ''}`,
      style: { left: `${l.x}%`, top: `${l.y}%` },
      title: l.nome,
      onclick: () => { audio.play('click'); if (portaDaVila?.escolher) portaDaVila.escolher(l); else o.onLugar(l); },
    }, el('i'), el('span', {}, l.nome));
    pinos.set(l.id, b);
    quadro.append(b);
  }
  quadro.prepend(svgRota);

  /** O próximo passo: a primeira missão em aberto, ou, sem nenhuma, o que fazer para achar uma. */
  function proximoPasso() {
    const aberta = Object.entries(o.estado.missoes ?? {}).find(([, est]) => est !== 'feita');
    const m = aberta ? o.missoes[aberta[0]] : null;
    return el('div', { class: 'vila-proximo' },
      el('strong', {}, 'Próximo passo'),
      m ? el('p', {}, el('b', {}, `${m.titulo}. `), m.texto)
        : el('p', {}, 'Nenhuma missão aberta. Fale com o dono da estalagem e com o chefe da vila: eles sabem o que a vila precisa.'));
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
        : el('p', {}, 'Nenhuma missão ainda. Fale com o dono da estalagem, com o chefe da vila e com os comerciantes.'),
      ...(o.grupo.some((c) => c.faccao) ? [el('h4', {}, 'Facções'),
        el('ul', {}, ...o.grupo.filter((c) => c.faccao).map((c) => el('li', {}, el('strong', {}, c.name), ` — ${c.titulo}`)))] : []),
      el('h4', {}, 'Pistas'),
      o.estado.pistas.length ? el('ul', {}, ...o.estado.pistas.map((p) => el('li', {}, p))) : el('p', {}, 'Nenhuma pista ainda. Ouça as conversas da estalagem.'),
      el('button', { class: 'vila-btn', onclick: () => { diario.hidden = true; } }, 'Fechar (Esc)'));
    diario.hidden = false;
    // Esc fecha, como na ficha.
    const esc = (e) => { if (e.key === 'Escape') { diario.hidden = true; removeEventListener('keydown', esc, true); } };
    addEventListener('keydown', esc, true);
  };

  const caixa = el('div', { class: `vila${o.classe ? ` ${o.classe}` : ''}` },
    el('header', { class: 'vila-topo' },
      el('h2', {}, o.titulo ?? 'Phandalin'), momento, dinheiro, faixa,
      el('div', { class: 'vila-acoes' },
        ...(o.botoes ?? []).map((b) => el('button', { class: 'vila-btn', title: b.dica ?? '', onclick: b.fazer }, b.rotulo)),
        el('button', { class: 'vila-btn', onclick: abrirDiario }, 'Diário'),
        el('button', { class: 'vila-btn', title: 'Ficha e inventário (vestir, guardar)', onclick: () => o.onFicha?.(o.grupo.find((c) => !c.dead && (portaDaVila?.meu ? portaDaVila.meu(c) : true)) ?? o.grupo.find((c) => !c.dead)) }, 'Ficha'),
        ...(o.onDormir ? [el('button', { class: 'vila-btn', onclick: () => o.onDormir() }, 'Dormir')] : []),
        el('button', { class: 'vila-btn discreto', onclick: () => o.onMenu() }, 'Menu'))),
    el('div', { class: 'vila-corpo' }, mapa, el('aside', { class: 'vila-lado' }, grupo, proximoPasso(), log)),
    diario);
  root.append(caixa);
  for (const t of o.estado.registro ?? []) log.prepend(el('li', {}, t));

  /** O que os outros jogadores veem desta tela (F6.3): os lugares, a hora, o dinheiro e o grupo. */
  function instantaneo() {
    return {
      titulo: o.titulo ?? 'Phandalin',
      chave: o.pintura ? 'regiao' : 'phandalin',
      proporcao: o.proporcao ?? null,
      classe: o.classe ?? null,
      oficial: o.oficial ?? null,
      lugares: o.lugares.filter((l) => (o.visivel ? o.visivel(l) : true)).map((l) => ({
        id: l.id, nome: l.nome, x: l.x, y: l.y, oficial: l.oficial ?? null, cidade: Boolean(l.cidade), fechado: !o.aberto(l), novidade: Boolean(o.novidade?.(l)),
      })),
      momento: o.momento(),
      dinheiro: o.dinheiro(),
      diario: diarioDe(o.estado, o.missoes),
      // Os botões desta tela (Acampar, Dormir…): os outros jogadores os veem e pedem ao anfitrião, que os roda por `api.acao`.
      acoes: [...(o.botoes ?? []).map((b, i) => ({ id: `b${i}`, rotulo: b.rotulo, dica: b.dica ?? '' })), ...(o.onDormir ? [{ id: 'dormir', rotulo: 'Dormir', dica: 'Onde passar a noite' }] : [])],
      registro: (o.estado.registro ?? []).slice(-40),
      grupo: o.grupo.filter((c) => !c.dead).map((c) => ({
        id: c.id, name: c.name, className: c.className ?? '', level: c.level ?? 1, titulo: c.titulo ?? null, look: c.look, hp: c.hp, maxHp: maxHpEfetivo(c),
      })),
    };
  }

  function atualizar() {
    desenharRota();
    momento.textContent = o.momento();
    dinheiro.textContent = moedas(o.dinheiro());
    // Votação do destino: uma insígnia com o número de votos em cada lugar e uma frase com o andamento.
    const votos = portaDaVila?.votos?.() ?? {};
    faixa.textContent = portaDaVila?.faixa?.() ?? '';
    for (const [id, pino] of pinos) {
      const n = votos[id]?.length ?? 0;
      pino.dataset.votos = n ? String(n) : '';
      pino.title = n ? `${o.lugares.find((l) => l.id === id)?.nome} — votaram: ${votos[id].join(', ')}` : (o.lugares.find((l) => l.id === id)?.nome ?? '');
    }
    portaDaVila?.aoAtualizar?.(instantaneo(), {
      lugares: o.lugares, ir: (l) => o.onLugar(l), atualizar,
      acao: (id) => (id === 'dormir' ? o.onDormir?.() : o.botoes?.[Number(id.slice(1))]?.fazer?.()),
    });
    for (const l of o.lugares) {
      // Na região, lugar que o grupo ainda não conhece nem aparece.
      pinos.get(l.id).hidden = o.visivel ? !o.visivel(l) : false;
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
        el('div', { class: 'vila-vida' }, el('i', { style: { width: `${Math.round(Math.max(0, c.hp) / maxHpEfetivo(c) * 100)}%` } }), el('span', {}, `${Math.max(0, c.hp)}/${maxHpEfetivo(c)}`))))));
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
    fechar: () => { caixa.remove(); portaDaVila?.aoFechar?.(); },
    get aberta() { return caixa.isConnected && !caixa.inert; },
  };
}
