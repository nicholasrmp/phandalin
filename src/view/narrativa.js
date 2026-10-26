// A tela de narrativa: texto de cena, testes de perícia e escolhas.
//
// Dois formatos:
//   tela    ocupa a janela inteira, sobre um fundo escuro — a abertura do
//           capítulo, o fim dele
//   painel  um pergaminho embaixo, por cima do tabuleiro — o que acontece no
//           meio da exploração (um cavalo examinado, um goblin visto)
//
// `narrar` devolve uma Promise que resolve com o `valor` da escolha clicada.
// Enquanto a narrativa está aberta ela segura o teclado (Enter ou espaço
// avançam), como o menu, para o turno não andar por trás.
//
// Uma página é { titulo?, texto: [parágrafos], teste?: { quem, pericia, total,
// cd, passou } }. Parágrafo pode ser string ou { nome, texto } — o nome sai em
// destaque, para as falas e as linhas de cada herói.
//
// Para conversas e telas com controles, a página ainda aceita:
//   retrato   o `look` de quem fala, num encaixe ao lado do texto
//   conteudo  um elemento pronto (a lista do descanso, por exemplo), posto
//             depois do texto
// E cada escolha pode trazer `detalhe` (a etiqueta "[Persuasão CD 12]") e
// `motivo` (fica em cinza, com o porquê: "só um anão saberia isso").
// `lista: true` empilha as escolhas, uma por linha, como numa conversa; os
// números 1 a 9 do teclado escolhem.

import './narrativa.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { makePortrait } from '../art/sheet.js';

let aberta = null;   // a narrativa da vez; uma só por vez

addEventListener('keydown', (e) => {
  if (!aberta) return;
  e.stopImmediatePropagation();
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    aberta.avancar();
  } else if (/^[1-9]$/.test(e.key)) {
    aberta.escolherNumero?.(Number(e.key));
  }
}, { capture: true });

export const narrativaAberta = () => Boolean(aberta);

/**
 * @param {HTMLElement} root
 * @param {{ formato?: 'tela'|'painel', paginas: object[], escolhas?: {rotulo:string, valor:any, primaria?:boolean}[], pular?: boolean }} opts
 */
function retratoDe(look) {
  try {
    const cv = makePortrait(look, 64);
    cv.className = 'pixel';
    return cv;
  } catch {
    return null;
  }
}

/**
 * A tela local: o que `narrar` sempre foi. `sinal` (um AbortSignal) fecha a
 * tela por fora, sem escolha — é como a porta compartilhada tira o painel da
 * frente de quem não decidiu quando outro respondeu primeiro.
 */
export function narrarLocal(root, {
  formato = 'tela', paginas, escolhas = null, pular = false, lista = false, sinal = null,
  // Numa sala (J-20): `nota` diz quem decide; `soLeitura` mostra as escolhas sem deixar clicar (decide outro jogador); `aoVotar`
  // faz do clique um VOTO: a escolha fica marcada e o painel espera a apuração (quem o fecha é o `sinal`).
  nota = null, soLeitura = false, aoVotar = null, assumirApos = null,
}) {
  return new Promise((resolve) => {
    let i = 0;
    let leitura = soLeitura;
    let relogioDaSubstituicao = null;
    const caixa = el('div', { class: `narrativa ${formato}`, role: 'dialog', 'aria-modal': 'true' });
    const folha = el('article', { class: 'narrativa-folha' });
    caixa.append(folha);
    root.append(caixa);

    const aoAbortar = () => fechar(undefined);
    function fechar(valor) {
      sinal?.removeEventListener('abort', aoAbortar);
      clearTimeout(relogioDaSubstituicao);
      if (aberta?.caixa === caixa) aberta = null;
      caixa.classList.add('saindo');
      setTimeout(() => caixa.remove(), 180);
      resolve(valor);
    }

    function desenhar() {
      const p = paginas[i];
      const ultima = i === paginas.length - 1;
      const botoes = [];
      if (pular && !ultima) {
        botoes.push(el('button', { class: 'narrativa-btn discreto', onclick: () => { audio.play('click'); i = paginas.length - 1; desenhar(); } }, 'Pular'));
      }
      let opcoes = null;
      let votei = false;
      const clicar = (esc, el_) => {
        audio.play('click');
        if (!aoVotar) { fechar(esc.valor); return; }
        if (votei) return;
        votei = true;
        aoVotar(esc.valor);
        for (const b of folha.querySelectorAll('.narrativa-opcao, .narrativa-btn')) b.disabled = true;
        el_?.classList.add('votada');
        folha.querySelector('.narrativa-nota')?.append(' Seu voto está dado: esperando os outros.');
      };
      if (ultima && escolhas?.length && lista) {
        let n = 0;
        opcoes = el('ol', { class: 'narrativa-opcoes' }, ...escolhas.map((esc) => {
          const numero = esc.motivo ? null : ++n;
          return el('li', {}, el('button', {
            class: `narrativa-opcao${esc.motivo ? ' recusada' : ''}`,
            disabled: Boolean(esc.motivo) || leitura,
            title: esc.motivo ?? null,
            'data-numero': numero,
            onclick: (e) => clicar(esc, e.currentTarget),
          },
          el('span', { class: 'narrativa-opcao-num' }, numero ?? '–'),
          el('span', {}, esc.detalhe && el('em', { class: 'narrativa-etiqueta' }, `[${esc.detalhe}] `), esc.rotulo,
            esc.motivo && el('small', {}, ` — ${esc.motivo}`))));
        }));
      } else if (ultima && escolhas?.length) {
        for (const esc of escolhas) {
          botoes.push(el('button', {
            class: `narrativa-btn${esc.primaria ? ' primario' : ''}`,
            disabled: Boolean(esc.motivo) || leitura,
            title: esc.motivo ?? null,
            onclick: (e) => clicar(esc, e.currentTarget),
          }, esc.detalhe ? `${esc.rotulo} [${esc.detalhe}]` : esc.rotulo));
        }
      } else {
        botoes.push(el('button', {
          class: 'narrativa-btn primario',
          // Virar a pagina soa como papel; fechar o painel e um clique de
          // interface, porque ai nao ha pagina nenhuma virando.
          onclick: () => { audio.play(ultima ? 'click' : 'pageWhisper'); if (ultima) fechar('fim'); else { i += 1; desenhar(); } },
        }, ultima ? 'Continuar' : 'Seguir'));
      }
      // Quatro estalos: a unica rolagem do jogo que o jogador para para ler
      // e a do teste de pericia na pagina. O combate rola dez vezes por turno
      // e um dado a cada rolagem viraria matraca.
      if (p.teste) audio.play('dice');
      const corpo = [
        p.teste && el('p', { class: `narrativa-teste ${p.teste.passou ? 'passou' : 'falhou'}` },
          `${p.teste.quem} · ${p.teste.pericia}: ${p.teste.total} contra CD ${p.teste.cd} — ${p.teste.passou ? 'sucesso' : 'falha'}${p.teste.fontes?.length ? ` (${p.teste.fontes.join('; ')})` : ''}`),
        ...(p.texto ?? []).map((t) => (typeof t === 'string'
          ? el('p', {}, t)
          : el('p', { class: 'narrativa-fala' }, el('strong', {}, t.nome), ' ', t.texto))),
      ].filter(Boolean);
      const retrato = p.retrato && retratoDe(p.retrato);
      folha.replaceChildren(...[
        p.titulo && el('h2', { class: 'narrativa-titulo' }, p.titulo),
        nota && ultima && escolhas?.length && el('p', { class: 'narrativa-nota' }, nota),
        retrato
          ? el('div', { class: 'narrativa-com-retrato' }, el('span', { class: 'narrativa-retrato' }, retrato), el('div', {}, ...corpo))
          : corpo,
        p.conteudo,
        opcoes,
        paginas.length > 1 && el('p', { class: 'narrativa-pagina' }, `${i + 1} de ${paginas.length}`),
        botoes.length && el('div', { class: 'narrativa-botoes' }, ...botoes),
      ].flat().filter(Boolean));
      (folha.querySelector('.narrativa-btn.primario') ?? folha.querySelector('.narrativa-opcao:not([disabled])'))?.focus();
    }

    aberta = {
      caixa,
      avancar: () => {
        // Enter na última página com escolhas não decide pelo jogador.
        if (i === paginas.length - 1 && escolhas?.length) return;
        folha.querySelector('.narrativa-btn.primario')?.click();
      },
      escolherNumero: (n) => folha.querySelector(`.narrativa-opcao[data-numero="${n}"]`)?.click(),
    };
    desenhar();
    // Quem decide sumiu ou não responde: depois deste tempo o anfitrião pode decidir no lugar dele (a sala não trava).
    if (leitura && assumirApos) {
      relogioDaSubstituicao = setTimeout(() => { leitura = false; nota = `${nota ?? ''} O tempo acabou: você pode decidir.`.trim(); desenhar(); }, assumirApos);
    }
    if (sinal) {
      if (sinal.aborted) fechar(undefined);
      else sinal.addEventListener('abort', aoAbortar, { once: true });
    }
  });
}

// A PORTA (MULTIJOGADOR.md, A-02): as cenas chamam `narrar`, e quem decide como
// a narrativa aparece é a porta. Sozinho, é a tela local; numa sala, o anfitrião
// põe `criarPortaCompartilhada` aqui e a mesma chamada passa a transmitir.
let porta = narrarLocal;

/** Troca a implementação de `narrar`; sem argumento, volta à tela local. */
export const definirPorta = (nova = null) => { porta = nova ?? narrarLocal; };

/** Assinatura que as cenas conhecem: `narrar(root, { formato, paginas, escolhas, pular, lista })`. */
export const narrar = (root, opts) => porta(root, opts);
