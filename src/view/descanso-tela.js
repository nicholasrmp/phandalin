// A tela do descanso: o grupo senta, cada herói decide quantos dados de vida
// gastar, e no fim volta o que volta (`rules/descanso.js`).
//
// CURTO. Uma linha por herói: retrato, vida, dados restantes e o botão de
// gastar UM dado — a regra é um por vez, olhando o resultado antes de decidir
// o próximo. "Gastar o sugerido" faz por todos o que um jogador faria sozinho
// (até perto da vida cheia, sem desperdiçar dado). "Terminar" devolve os
// recursos de descanso curto.
//
// LONGO. Não há o que decidir: uma página contando o que voltou.
//
// Roda dentro da narrativa (`narrar`), que já segura o teclado e o clique no
// tabuleiro enquanto está aberta.

import './descanso-tela.css';
import { el } from './hud.js';
import { audio } from '../core/audio.js';
import { makePortrait } from '../art/sheet.js';
import { narrar } from './narrativa.js';
import {
  dadoDeVida, dadosDeVida, gastarDadoDeVida, dadosSugeridos, recuperarNoCurto, descansoLongo, oracaoDeCura, bomFrutoNoDescanso,
} from '../rules/descanso.js';
import { CLASSES, nomeDaCaracteristica } from '../rules/classes/index.js';
import { hasCondition } from '../rules/conditions.js';
import { magiasProntas, SPELLS, dadosDaMagia } from '../rules/spells.js';
import { spellMod } from '../rules/party.js';

function retrato(look) {
  try {
    const cv = makePortrait(look, 36);
    cv.className = 'pixel';
    return cv;
  } catch {
    return el('span');
  }
}

const nomeDaClasse = (c) => c.className ?? CLASSES[c.classe]?.nome ?? '';

function linhaDoHeroi(c, rng, registro, grupo = { vivos: [c], atualizarTodas: () => {} }) {
  const vida = el('div', { class: 'descanso-vida' }, el('i'), el('span'));
  const dados = el('span', { class: 'descanso-dados' });
  const ultimo = el('span', { class: 'descanso-ultimo' });
  const botao = el('button', { class: 'descanso-gastar' }, 'Gastar 1 dado');

  const atualizar = () => {
    const frac = Math.max(0, Math.min(1, c.hp / c.maxHp));
    vida.firstChild.style.width = `${Math.round(frac * 100)}%`;
    vida.lastChild.textContent = `${Math.max(0, c.hp)}/${c.maxHp} PV`;
    const restam = dadosDeVida(c);
    dados.textContent = `${restam}× d${dadoDeVida(c)}`;
    dados.title = `${restam} dado${restam === 1 ? '' : 's'} de vida restante${restam === 1 ? '' : 's'}`;
    botao.disabled = restam <= 0 || c.hp >= c.maxHp;
    botao.title = restam <= 0 ? 'sem dados de vida' : c.hp >= c.maxHp ? 'vida cheia' : '';
  };

  const gastar = () => {
    const r = gastarDadoDeVida(rng, c);
    if (!r) return null;
    const con = r.con ? ` ${r.con > 0 ? '+' : '−'} ${Math.abs(r.con)}` : '';
    ultimo.textContent = `d${r.lados}: ${r.rolagem}${con} → +${r.cura}`;
    ultimo.classList.remove('pulso');
    void ultimo.offsetWidth;
    ultimo.classList.add('pulso');
    registro.push(`${c.name} gasta um dado de vida: d${r.lados} ${r.rolagem}${con} → +${r.cura} PV (restam ${r.restam}).`);
    atualizar();
    return r;
  };
  botao.addEventListener('click', () => { audio.play('click'); gastar(); });

  // Oração de Cura (10 minutos): quem a tem pronta e espaço de 2º círculo ou
  // mais reza pelos aliados vivos (até 6, os mais feridos primeiro).
  const orar = el('span', { class: 'descanso-oracao' });
  const rezar = (circulo) => {
    const alvos = [...grupo.vivos].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 6);
    const r = oracaoDeCura(rng, c, alvos, { circulo });
    if (!r.ok) {
      ultimo.textContent = r.why;
      registro.push(`${c.name} não consegue rezar: ${r.why}.`);
    } else {
      const soma = r.curas.reduce((n, x) => n + x.cura, 0);
      ultimo.textContent = `Oração de Cura (${circulo}º): +${soma} PV no grupo`;
      registro.push(`${c.name} reza a Oração de Cura (${circulo}º círculo): ${r.curas.map((x) => `${x.alvo.name} +${x.cura}`).join(', ')}.`);
    }
    ultimo.classList.remove('pulso');
    void ultimo.offsetWidth;
    ultimo.classList.add('pulso');
    grupo.atualizarTodas();
  };
  // Bom Fruto (1º círculo): as dez frutinhas curam 1 PV cada, a quem mais precisa.
  const comerFruto = (circulo) => {
    const alvos = [...grupo.vivos].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    const r = bomFrutoNoDescanso(c, alvos, { circulo });
    if (!r.ok) {
      ultimo.textContent = r.why;
      registro.push(`${c.name} não consegue conjurar o Bom Fruto: ${r.why}.`);
    } else {
      const soma = r.curas.reduce((n, x) => n + x.cura, 0);
      ultimo.textContent = `Bom Fruto (${circulo}º): +${soma} PV no grupo`;
      registro.push(`${c.name} conjura o Bom Fruto (${circulo}º círculo): ${r.curas.map((x) => `${x.alvo.name} +${x.cura}`).join(', ')}.`);
    }
    ultimo.classList.remove('pulso');
    void ultimo.offsetWidth;
    ultimo.classList.add('pulso');
    grupo.atualizarTodas();
  };
  // Um grupo por magia: "Bom Fruto  [1º ×2] [2º ×1] [3º ×0]", com o ganho e os
  // espaços que restam. O círculo sem espaço fica desabilitado, com o motivo.
  const grupoDeMagia = (spellId, nome, minimo, ganho, fazer, descricao) => {
    const sl = c.spellcasting.slots ?? [];
    const chips = [];
    let algum = false;
    for (let n = minimo; n < sl.length; n++) {
      const restam = sl[n] ?? 0;
      const b = el('button', {
        class: 'descanso-gastar descanso-orar',
        title: restam > 0 ? `${descricao}; gasta um espaço de ${n}º círculo (restam ${restam})` : `sem espaço de ${n}º círculo`,
        disabled: restam <= 0,
        'aria-label': `${nome}, ${n}º círculo, restam ${restam}`,
      }, `${n}º ×${restam}`);
      if (restam > 0) { algum = true; b.addEventListener('click', () => { audio.play('click'); fazer(n); }); }
      chips.push(b);
    }
    return el('span', { class: 'descanso-magia' },
      el('strong', {}, nome),
      el('small', {}, algum ? ganho : `${ganho} · sem espaço de ${minimo}º círculo ou maior`),
      ...chips);
  };
  const atualizarOracao = () => {
    orar.replaceChildren();
    if (!c.spellcasting || c.dead) return;
    const prontas = magiasProntas(c);
    if (prontas.includes('bomFruto')) {
      orar.append(grupoDeMagia('bomFruto', 'Bom Fruto', SPELLS.bomFruto.level,
        `${SPELLS.bomFruto.frutos} PV no total, 1 por fruta, a quem mais precisa`, comerFruto, 'dez frutinhas, 1 PV cada'));
    }
    if (prontas.includes('oracaoDeCura')) {
      const sp = SPELLS.oracaoDeCura;
      orar.append(grupoDeMagia('oracaoDeCura', 'Oração de Cura', sp.level,
        `${dadosDaMagia(sp, { circulo: sp.level, notacao: sp.heal })}+${spellMod(c)} PV em cada um, até ${sp.targets} aliados (10 min)`, rezar, 'cura até 6 aliados'));
    }
  };
  const atualizarTudo = () => { atualizar(); atualizarOracao(); };

  atualizarTudo();
  const linha = el('div', { class: 'descanso-linha' },
    el('span', { class: 'descanso-retrato' }, retrato(c.look)),
    el('div', { class: 'descanso-quem' },
      el('strong', {}, c.name),
      el('small', {}, [nomeDaClasse(c), hasCondition(c, 'inconsciente') ? 'caído, estável' : ''].filter(Boolean).join(' · '))),
    vida, dados, botao, ultimo, orar);
  return { linha, atualizar: atualizarTudo, gastarSugerido: () => { for (let n = dadosSugeridos(c); n > 0; n--) if (!gastar()) break; } };
}

/**
 * Descanso curto do grupo. Devolve as linhas do registro.
 * @param {HTMLElement} root
 * @param {{ herois: object[], rng: object, titulo?: string, texto?: string[] }} o
 */
export async function descansoCurto(root, { herois, rng, titulo = 'Descanso curto', texto = null }) {
  const vivos = herois.filter((c) => !c.dead);
  const registro = [];
  const grupo = { vivos, atualizarTodas: () => linhas.forEach((l) => l.atualizar()) };
  const linhas = vivos.map((c) => linhaDoHeroi(c, rng, registro, grupo));
  const conteudo = el('div', { class: 'descanso' },
    el('div', { class: 'descanso-topo' },
      el('span', {}, 'Cada dado cura o que rolar mais a Constituição. Um por vez.'),
      el('button', {
        class: 'descanso-auto',
        onclick: () => { audio.play('click'); for (const l of linhas) l.gastarSugerido(); },
      }, 'Gastar o sugerido')),
    ...linhas.map((l) => l.linha));

  await narrar(root, {
    formato: 'tela',
    paginas: [{
      titulo,
      texto: texto ?? ['Uma hora de pausa: curar as feridas, beber água, recuperar o fôlego.'],
      conteudo,
    }],
    escolhas: [{ rotulo: 'Terminar o descanso', valor: 'fim', primaria: true }],
  });

  for (const c of vivos) {
    const voltou = recuperarNoCurto(c);
    if (voltou.length) registro.push(`${c.name} recupera: ${voltou.map(nomeDaCaracteristica).join(', ')}.`);
  }
  registro.push('O grupo termina uma hora de descanso.');
  return registro;
}

/** Descanso longo do grupo: tudo volta. Devolve as linhas do registro. */
export async function descansoLongoDoGrupo(root, { herois, titulo = 'Descanso longo', texto = null }) {
  const vivos = herois.filter((c) => !c.dead);
  for (const c of vivos) descansoLongo(c);
  await narrar(root, {
    formato: 'tela',
    paginas: [{
      titulo,
      texto: [
        ...(texto ?? ['Oito horas: uma refeição quente, turnos de vigia, sono.']),
        `${vivos.map((c) => c.name).join(', ')} acordam com a vida cheia, os espaços de magia e os recursos de volta, e metade dos dados de vida gastos.`,
      ],
    }],
  });
  return ['O grupo termina um descanso longo: vida, magia e recursos de volta.'];
}
