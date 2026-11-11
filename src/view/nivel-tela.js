// A tela de subir de nível: um cartão por herói, com o que ele ganhou e as
// magias novas para escolher (já preenchidas com a sugestão — "Seguir" sem
// mexer em nada vale como a escolha automática).
//
// Roda dentro da narrativa (`narrar`), que segura o teclado e o tabuleiro.

import './nivel-tela.css';
import { el } from './hud.js';
import { makePortrait } from '../art/sheet.js';
import { narrar } from './narrativa.js';
import { subirUmNivel, depoisDeSubirNivel, dadosDoCartao, escolhasConferidas, escolhaDeSubclasse, escolhaDeAumento } from '../game/nivel.js';
import { audio } from '../core/audio.js';

function retrato(look) {
  try {
    const cv = makePortrait(look, 36);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span');
  }
}

// ---- numa sala, cada jogador escolhe as magias do SEU herói (MULTIJOGADOR.md, J-09) -----------------------------------------------

let porta = null;
/**
 * A porta do nível: `dono(c)` diz a quem pertence o herói (`null` = esta tela, o anfitrião; senão o id público do jogador),
 * `pedir(c, dados)` manda o cartão ao dono e devolve as escolhas dele (ou `null`: usa as sugeridas), e `local(root, opts)` é a
 * tela do anfitrião, que NÃO é transmitida (cada jogador vê só o cartão do seu herói).
 */
export function definirPortaDeNivel(p) { porta = p; }

/** O cartão de um herói, a partir do dado puro. `selecoes` é preenchido com as sugeridas e muda conforme o jogador escolhe. */
export function montarCartao(d, selecoes) {
  const blocos = d.escolhas.map((e) => {
    if (e.deLivro) return el('p', { class: 'nivel-nota' }, `${e.rotulo}: as melhores do livro, automaticamente.`);
    selecoes[e.id] = [...e.sugeridas];
    const selects = Array.from({ length: e.quantas }, (_, k) => el('select', {
      class: 'nivel-select',
      onchange: (ev) => { selecoes[e.id][k] = ev.target.value; },
    }, ...e.opcoes.map((o) => el('option', { value: o.id, title: o.desc ?? '', selected: o.id === e.sugeridas[k] }, o.nome))));
    return el('div', { class: 'nivel-escolha' }, el('span', {}, e.rotulo), ...selects);
  });
  return el('div', { class: 'nivel-cartao' },
    el('span', { class: 'nivel-retrato' }, retrato(d.look)),
    el('div', {},
      el('strong', {}, `${d.nome} · ${d.className ?? ''}`),
      ...d.ganhos.map((g) => el('p', {}, g)),
      ...blocos));
}

/** A tela do jogador de fora: o cartão do herói dele; devolve as escolhas quando ele segue. */
export async function telaDoCartao(root, d, { sinal = null, narrarFn = narrar } = {}) {
  const selecoes = {};
  const cartao = montarCartao(d, selecoes);
  await narrarFn(root, {
    formato: 'tela', sinal,
    paginas: [{ titulo: 'Subir de nível', texto: ['Você sobe de nível. Escolha as magias novas do seu herói.'], conteudo: el('div', { class: 'nivel-lista' }, cartao) }],
    escolhas: [{ rotulo: 'Seguir', valor: 'ok', primaria: true }],
  });
  return selecoes;
}

/**
 * O bloco de um herói na página do aumento: a lista (o aumento primeiro, depois os talentos) e, embaixo, o que a opção faz
 * e a escolha a mais dela, quando tem. `aumentos[c.id]` guarda { id, campo? } e muda conforme o jogador escolhe.
 */
export function blocoDeAumento(c, aumentos) {
  const e = escolhaDeAumento(c);
  const explica = el('p', { class: 'nivel-nota' });
  const subCaixa = el('span', {});
  const regra = el('p', { class: 'nivel-nota nivel-regra' });
  const mostrar = (id) => {
    const o = e.opcoes.find((x) => x.id === id);
    aumentos[c.id] = { id };
    explica.textContent = o.desc;
    regra.textContent = o.regra ?? '';
    subCaixa.replaceChildren();
    if (o.sub) {
      aumentos[c.id][o.sub.campo] = o.sub.padrao ?? o.sub.opcoes[0].id;
      subCaixa.append(el('select', { class: 'nivel-select', onchange: (ev) => { aumentos[c.id][o.sub.campo] = ev.target.value; } },
        ...o.sub.opcoes.map((s) => el('option', { value: s.id, selected: s.id === aumentos[c.id][o.sub.campo] }, `${o.sub.rotulo}: ${s.nome}`))));
    }
  };
  const sel = el('select', { class: 'nivel-select', onchange: (ev) => mostrar(ev.target.value) },
    ...e.opcoes.map((o) => el('option', { value: o.id, title: o.desc }, o.nome)));
  mostrar(e.opcoes[0].id);
  return el('div', { class: 'nivel-escolha' }, el('span', {}, `${c.name}: ${e.rotulo}`), sel, subCaixa, explica, regra);
}

/** Sobe um nível de cada herói da lista, com a tela. Devolve as linhas do registro. */
export async function telaDeSubirNivel(root, herois) {
  // O acorde de subir de nivel: quatro notas que se SOBREPOEM, o unico som
  // simultaneo do jogo. Toca UMA vez para a tela toda, nao por heroi — quatro
  // acordes empilhados viram barulho e tiram justamente o peso que ele tem.
  audio.play('levelUp');
  const registro = [];
  // A SUBCLASSE se escolhe ANTES de subir (ela muda o que o nível dá). Os heróis de outros jogadores seguem o padrão.
  const subclasses = {};
  const quemEscolhe = herois.filter((c) => escolhaDeSubclasse(c) && !porta?.dono(c));
  if (quemEscolhe.length) {
    const blocos = quemEscolhe.map((c) => {
      const e = escolhaDeSubclasse(c);
      subclasses[c.id] = e.opcoes[0].id;
      return el('div', { class: 'nivel-escolha' },
        el('span', {}, `${c.name}: ${e.rotulo}`),
        el('select', { class: 'nivel-select', onchange: (ev) => { subclasses[c.id] = ev.target.value; } },
          ...e.opcoes.map((o) => el('option', { value: o.id, title: o.desc, selected: o.id === subclasses[c.id] }, o.desc ? `${o.nome} — ${o.desc}` : o.nome))));
    });
    await (porta?.local ?? narrar)(root, {
      formato: 'tela',
      paginas: [{ titulo: 'Escolha de caminho', texto: ['O herói chega a um ponto da vida em que escolhe o caminho que seguirá.'], conteudo: el('div', { class: 'nivel-lista' }, ...blocos) }],
      escolhas: [{ rotulo: 'Seguir', valor: 'ok', primaria: true }],
    });
  }
  // AUMENTO OU TALENTO: nos níveis de aumento, o jogador troca o aumento de atributo por um talento do Livro do Jogador.
  const aumentos = {};
  const quemAumenta = herois.filter((c) => escolhaDeAumento(c) && !porta?.dono(c));
  if (quemAumenta.length) {
    await (porta?.local ?? narrar)(root, {
      formato: 'tela',
      paginas: [{ titulo: 'Aumento ou talento', texto: ['Cada um pode ficar mais forte no que já é, ou aprender um jeito novo de lutar.'], conteudo: el('div', { class: 'nivel-lista' }, ...quemAumenta.map((c) => blocoDeAumento(c, aumentos))) }],
      escolhas: [{ rotulo: 'Seguir', valor: 'ok', primaria: true }],
    });
  }
  const escolhasDe = (c) => ({
    ...(subclasses[c.id] ? { subclasse: subclasses[c.id] } : {}),
    ...(aumentos[c.id] && aumentos[c.id].id !== 'asi' ? { talento: aumentos[c.id] } : {}),
  });
  const itens = herois.map((c) => ({ c, r: subirUmNivel(c, escolhasDe(c)), selecoes: {}, dono: porta?.dono(c) ?? null }));
  // Os heróis de OUTROS jogadores: o cartão vai ao dono, que escolhe em paralelo (sem resposta, valem as sugeridas).
  const esperas = itens.filter((i) => i.dono).map((i) => porta.pedir(i.c, dadosDoCartao(i.c, i.r), i.dono)
    .then((enviadas) => { i.selecoes = escolhasConferidas(i.r.escolhas, enviadas); }));
  const locais = itens.filter((i) => !i.dono);
  const tela = porta?.local ?? narrar;
  if (locais.length) {
    const cartoes = locais.map((i) => montarCartao(dadosDoCartao(i.c, i.r), i.selecoes));
    await tela(root, {
      formato: 'tela',
      paginas: [{
        titulo: 'Subir de nível',
        texto: ['A experiência do esconderijo pesa: cada um sai dele melhor do que entrou.'],
        conteudo: el('div', { class: 'nivel-lista' }, ...cartoes),
      }],
      escolhas: [{ rotulo: 'Seguir', valor: 'ok', primaria: true }],
    });
  }
  if (esperas.length) {
    // Quem já escolheu espera os outros jogadores, com a tela aberta.
    const ctl = new AbortController();
    let terminou = false;
    const feito = Promise.all(esperas).then(() => { terminou = true; ctl.abort(); });
    // Se o anfitrião fechar a página de espera, ela volta: o jogo só segue quando todos escolheram.
    while (!terminou) {
      await tela(root, {
        formato: 'tela', sinal: ctl.signal,
        paginas: [{ titulo: 'Subir de nível', texto: [`Esperando ${itens.filter((i) => i.dono).map((i) => i.c.name).join(', ')} escolher${esperas.length > 1 ? 'em' : ''} as magias.`] }],
      });
    }
    await feito;
  }
  for (const i of itens) {
    i.r.aplicar(i.selecoes);
    registro.push(`${i.c.name} sobe para o ${i.c.level}º nível.`);
  }
  depoisDeSubirNivel();
  return registro;
}
