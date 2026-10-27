// A tela das dicas contextuais (`game/tutorial.js`): um cartão no canto, sem tomar o teclado nem o tabuleiro, que some com "Entendi".
// Várias dicas de um mesmo gatilho entram em fila. "Não mostrar dicas" desliga todas, e fica lembrado.

import './dicas.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { dicasDoGatilho, lerDicas, guardarDicas } from '../game/tutorial.js';

/** `**negrito**` dentro de um texto da dica, sem HTML solto. */
function paragrafo(texto) {
  const p = el('p', {});
  texto.split(/(\*\*[^*]+\*\*)/).forEach((parte) => {
    if (/^\*\*[^*]+\*\*$/.test(parte)) p.append(el('strong', {}, parte.slice(2, -2)));
    else if (parte) p.append(parte);
  });
  return p;
}

export function criarDicas(root, storage) {
  let estado = lerDicas(storage);
  const fila = [];
  let atual = null;

  function mostrarProxima() {
    if (atual || !fila.length) return;
    const d = fila.shift();
    estado.vistas.add(d.id);
    guardarDicas(storage, estado);
    const fechar = () => { atual?.remove(); atual = null; setTimeout(mostrarProxima, 250); };
    atual = el('aside', { class: 'dicas-cartao', role: 'note', 'aria-live': 'polite' },
      el('strong', { class: 'dicas-titulo' }, d.titulo),
      ...d.texto.map(paragrafo),
      el('div', { class: 'dicas-botoes' },
        el('button', { class: 'dicas-btn primario', onclick: () => { audio.play('click'); fechar(); } }, 'Entendi'),
        el('button', { class: 'dicas-btn', onclick: () => { audio.play('click'); estado.ligado = false; guardarDicas(storage, estado); fila.length = 0; fechar(); } }, 'Não mostrar dicas')));
    root.append(atual);
  }

  return {
    /** Algo aconteceu no jogo: mostra as dicas desse gatilho que ainda não foram vistas. */
    gatilho(nome) {
      for (const d of dicasDoGatilho(nome, estado.vistas, { ligado: estado.ligado })) if (!fila.some((x) => x.id === d.id)) fila.push(d);
      mostrarProxima();
    },
    /** Opções: volta a mostrar tudo, do começo. */
    reiniciar() { estado = { vistas: new Set(), ligado: true }; guardarDicas(storage, estado); },
    ligadas: () => estado.ligado,
  };
}
