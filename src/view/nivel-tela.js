// A tela de subir de nível: um cartão por herói, com o que ele ganhou e as
// magias novas para escolher (já preenchidas com a sugestão — "Seguir" sem
// mexer em nada vale como a escolha automática).
//
// Roda dentro da narrativa (`narrar`), que segura o teclado e o tabuleiro.

import './nivel-tela.css';
import { el } from './hud.js';
import { makePortrait } from '../art/sheet.js';
import { narrar } from './narrativa.js';
import { subirUmNivel, nomeDaMagiaJogavel } from '../game/nivel.js';
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

/** Sobe um nível de cada herói da lista, com a tela. Devolve as linhas do registro. */
export async function telaDeSubirNivel(root, herois) {
  // O acorde de subir de nivel: quatro notas que se SOBREPOEM, o unico som
  // simultaneo do jogo. Toca UMA vez para a tela toda, nao por heroi — quatro
  // acordes empilhados viram barulho e tiram justamente o peso que ele tem.
  audio.play('levelUp');
  const registro = [];
  const cartoes = [];
  const aplicacoes = [];
  for (const c of herois) {
    const r = subirUmNivel(c);
    const selecoes = {};
    const blocos = r.escolhas.map((e) => {
      if (e.deLivro) {
        // O mago prepara do livro — com as que acabou de escrever, então a
        // escolha vale a sugestão.
        return el('p', { class: 'nivel-nota' }, `${e.rotulo}: as melhores do livro, automaticamente.`);
      }
      selecoes[e.id] = [...e.sugeridas];
      const selects = Array.from({ length: e.quantas }, (_, k) => el('select', {
        class: 'nivel-select',
        onchange: (ev) => { selecoes[e.id][k] = ev.target.value; },
      }, ...e.opcoes.map((s) => el('option', { value: s, selected: s === e.sugeridas[k] }, nomeDaMagiaJogavel(s)))));
      return el('div', { class: 'nivel-escolha' }, el('span', {}, e.rotulo), ...selects);
    });
    cartoes.push(el('div', { class: 'nivel-cartao' },
      el('span', { class: 'nivel-retrato' }, retrato(c.look)),
      el('div', {},
        el('strong', {}, `${c.name} · ${c.className ?? ''}`),
        ...r.ganhos.map((g) => el('p', {}, g)),
        ...blocos)));
    aplicacoes.push(() => {
      r.aplicar(selecoes);
      registro.push(`${c.name} sobe para o ${c.level}º nível.`);
    });
  }
  await narrar(root, {
    formato: 'tela',
    paginas: [{
      titulo: 'Subir de nível',
      texto: ['A experiência do esconderijo pesa: cada um sai dele melhor do que entrou.'],
      conteudo: el('div', { class: 'nivel-lista' }, ...cartoes),
    }],
    escolhas: [{ rotulo: 'Seguir', valor: 'ok', primaria: true }],
  });
  for (const f of aplicacoes) f();
  return registro;
}
