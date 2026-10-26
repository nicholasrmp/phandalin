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
import { hasCondition, nivelDeExaustao, maxHpEfetivo } from '../rules/conditions.js';
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

/**
 * As magias de cura que o herói pode rezar no descanso, como dado: { id, nome, minimo, ganho, descricao }. O mesmo dado desenha a
 * linha do anfitrião e a dos outros jogadores.
 */
export function magiasDoDescanso(c) {
  if (!c.spellcasting || c.dead) return [];
  const prontas = magiasProntas(c);
  const out = [];
  if (prontas.includes('bomFruto')) {
    out.push({ id: 'bomFruto', nome: 'Bom Fruto', minimo: SPELLS.bomFruto.level, ganho: `${SPELLS.bomFruto.frutos} PV no total, 1 por fruta, a quem mais precisa`, descricao: 'dez frutinhas, 1 PV cada' });
  }
  if (prontas.includes('oracaoDeCura')) {
    const sp = SPELLS.oracaoDeCura;
    out.push({ id: 'oracaoDeCura', nome: 'Oração de Cura', minimo: sp.level, ganho: `${dadosDaMagia(sp, { circulo: sp.level, notacao: sp.heal })}+${spellMod(c)} PV em cada um, até ${sp.targets} aliados (10 min)`, descricao: 'cura até 6 aliados' });
  }
  return out;
}

/** A linha de um herói como dado puro (vai pela rede): o que os outros jogadores veem do descanso dele. */
export function dadosDaLinha(c, ultimo = '') {
  return {
    heroi: c.id, nome: c.name, className: nomeDaClasse(c), look: c.look ?? null, caido: hasCondition(c, 'inconsciente'),
    hp: c.hp, maxHp: maxHpEfetivo(c), restam: dadosDeVida(c), lados: dadoDeVida(c), ultimo,
    magias: magiasDoDescanso(c).map((m) => ({ ...m, slots: [...(c.spellcasting?.slots ?? [])] })),
  };
}

function linhaDoHeroi(c, rng, registro, grupo = { vivos: [c], atualizarTodas: () => {} }, { remoto = false } = {}) {
  const vida = el('div', { class: 'descanso-vida' }, el('i'), el('span'));
  const dados = el('span', { class: 'descanso-dados' });
  const ultimo = el('span', { class: 'descanso-ultimo' });
  const botao = el('button', { class: 'descanso-gastar' }, 'Gastar 1 dado');

  const atualizar = () => {
    const frac = Math.max(0, Math.min(1, c.hp / maxHpEfetivo(c)));
    vida.firstChild.style.width = `${Math.round(frac * 100)}%`;
    vida.lastChild.textContent = `${Math.max(0, c.hp)}/${maxHpEfetivo(c)} PV`;
    const restam = dadosDeVida(c);
    dados.textContent = `${restam}× d${dadoDeVida(c)}`;
    dados.title = `${restam} dado${restam === 1 ? '' : 's'} de vida restante${restam === 1 ? '' : 's'}`;
    botao.disabled = remoto || restam <= 0 || c.hp >= maxHpEfetivo(c);
    botao.title = remoto ? 'a escolha é do dono do herói' : restam <= 0 ? 'sem dados de vida' : c.hp >= maxHpEfetivo(c) ? 'vida cheia' : '';
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
    grupo.aoMudar?.();      // numa sala, os outros jogadores veem o dado gasto
    return r;
  };
  botao.addEventListener('click', () => { audio.play('click'); gastar(); });

  // Oração de Cura (10 minutos): quem a tem pronta e espaço de 2º círculo ou
  // mais reza pelos aliados vivos (até 6, os mais feridos primeiro).
  const orar = el('span', { class: 'descanso-oracao' });
  const rezar = (circulo) => {
    const alvos = [...grupo.vivos].sort((a, b) => a.hp / maxHpEfetivo(a) - b.hp / maxHpEfetivo(b)).slice(0, 6);
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
    const alvos = [...grupo.vivos].sort((a, b) => a.hp / maxHpEfetivo(a) - b.hp / maxHpEfetivo(b));
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
        disabled: restam <= 0 || remoto,
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
  const atualizarTudo = () => { atualizar(); atualizarOracao(); grupo.aoMudar?.(); };

  atualizarTudo();
  const linha = el('div', { class: 'descanso-linha' },
    el('span', { class: 'descanso-retrato' }, retrato(c.look)),
    el('div', { class: 'descanso-quem' },
      el('strong', {}, c.name),
      el('small', {}, [nomeDaClasse(c), hasCondition(c, 'inconsciente') ? 'caído, estável' : ''].filter(Boolean).join(' · '))),
    vida, dados, botao, ultimo, orar);
  return {
    linha, atualizar: atualizarTudo, gastar,
    gastarSugerido: () => { for (let n = dadosSugeridos(c); n > 0; n--) if (!gastar()) break; },
    dados: () => dadosDaLinha(c, ultimo.textContent),
    // A magia rezada a pedido do dono (que a escolheu na tela dele).
    magia: (spellId, circulo) => (spellId === 'bomFruto' ? comerFruto(circulo) : spellId === 'oracaoDeCura' ? rezar(circulo) : null),
  };
}

/**
 * Descanso curto do grupo. Devolve as linhas do registro.
 * @param {HTMLElement} root
 * @param {{ herois: object[], rng: object, titulo?: string, texto?: string[] }} o
 */
export async function descansoCurto(root, { herois, rng, titulo = 'Descanso curto', texto = null, automaticos = null, porta = null }) {
  const vivos = herois.filter((c) => !c.dead);
  const registro = [];
  // Numa sala (`porta`): cada jogador gasta os dados do SEU herói na tela dele; a do anfitrião mostra todos e só deixa mexer nos dele.
  const donos = new Map(vivos.map((c) => [c.id, porta?.dono(c) ?? null]));
  const remotos = new Set([...donos.values()].filter(Boolean));
  const prontos = new Set();
  let agenda = null;
  const publicar = () => {
    if (!porta || agenda) return;
    agenda = setTimeout(() => { agenda = null; porta.estado(vivos.map((c, i) => linhas[i].dados()), [...prontos]); }, 60);
  };
  const grupo = { vivos, atualizarTodas: () => linhas.forEach((l) => l.atualizar()), aoMudar: publicar };
  const linhas = vivos.map((c) => linhaDoHeroi(c, rng, registro, grupo, { remoto: Boolean(donos.get(c.id)) }));
  let todosProntos = () => {};
  const esperaProntos = new Promise((resolve) => { todosProntos = resolve; });
  const checar = () => { if ([...remotos].every((p) => prontos.has(p))) todosProntos(); };
  porta?.abrir({
    titulo, texto: texto ?? ['Uma hora de pausa: curar as feridas, beber água, recuperar o fôlego.'],
    gastar: (heroi, pub) => { const i = vivos.findIndex((c) => c.id === heroi); if (i >= 0 && donos.get(heroi) === pub && !prontos.has(pub)) linhas[i].gastar(); },
    magia: (heroi, pub, spellId, circulo) => { const i = vivos.findIndex((c) => c.id === heroi); if (i >= 0 && donos.get(heroi) === pub && !prontos.has(pub)) linhas[i].magia(spellId, circulo); },
    pronto: (pub) => { if (!remotos.has(pub)) return; prontos.add(pub); publicar(); checar(); },
  });
  publicar();
  // Numa sala, os heróis de OUTROS jogadores gastam os dados sugeridos por conta própria: a tela é do anfitrião, e só ele a vê.
  if (automaticos?.size) for (const [i, c] of vivos.entries()) if (automaticos.has(c.id)) linhas[i].gastarSugerido();
  const conteudo = el('div', { class: 'descanso' },
    el('div', { class: 'descanso-topo' },
      el('span', {}, 'Cada dado cura o que rolar mais a Constituição. Um por vez.'),
      el('button', {
        class: 'descanso-auto',
        onclick: () => { audio.play('click'); for (const [i, l] of linhas.entries()) if (!donos.get(vivos[i].id)) l.gastarSugerido(); },
      }, 'Gastar o sugerido')),
    ...linhas.map((l) => l.linha));

  const tela = porta?.local ?? narrar;    // a tabela do anfitrião NÃO é transmitida: cada jogador tem a sua
  await tela(root, {
    formato: 'tela',
    paginas: [{
      titulo,
      texto: texto ?? ['Uma hora de pausa: curar as feridas, beber água, recuperar o fôlego.'],
      conteudo,
    }],
    escolhas: [{ rotulo: 'Terminar o descanso', valor: 'fim', primaria: true }],
  });

  // Depois do "Terminar" do anfitrião, espera quem ainda está escolhendo (no máximo dois minutos: a vida de cada um fica como está).
  if (remotos.size && ![...remotos].every((p) => prontos.has(p))) {
    const ctl = new AbortController();
    let acabou = false;
    const fim = Promise.race([esperaProntos, new Promise((r) => setTimeout(r, 120_000))]).then(() => { acabou = true; ctl.abort(); });
    while (!acabou) {
      await tela(root, {
        formato: 'tela', sinal: ctl.signal,
        paginas: [{ titulo, texto: [`Esperando ${[...remotos].filter((p) => !prontos.has(p)).length} jogador(es) terminar(em) o descanso.`] }],
      });
    }
    await fim;
  }
  clearTimeout(agenda);
  porta?.fechar();

  for (const c of vivos) {
    const voltou = recuperarNoCurto(c);
    if (voltou.length) registro.push(`${c.name} recupera: ${voltou.map(nomeDaCaracteristica).join(', ')}.`);
  }
  registro.push('O grupo termina uma hora de descanso.');
  return registro;
}

/** Descanso longo do grupo: tudo volta. Devolve as linhas do registro. */
/**
 * `alimentado` é uma função `(heroi) => boolean`: o livro só tira um degrau de
 * exaustão de quem descansou COM comida e bebida. Na viagem, quem passou o dia
 * sem comer dorme, mas não se recupera do cansaço.
 */
export async function descansoLongoDoGrupo(root, { herois, titulo = 'Descanso longo', texto = null, alimentado = null, descansou = null }) {
  const vivos = herois.filter((c) => !c.dead);
  const antes = new Map(vivos.map((c) => [c, nivelDeExaustao(c)]));
  // `descansou` é a vigia do acampamento (`rules/acampamento.js`): quem passou
  // quatro horas acordado não teve descanso LONGO. Mas teve horas sem esforço,
  // então leva o CURTO: os recursos que voltam numa hora de pausa.
  const dormiram = [];
  const soCurto = [];
  for (const c of vivos) {
    if (descansou && !descansou(c)) {
      recuperarNoCurto(c);
      soCurto.push(c);
      continue;
    }
    descansoLongo(c, { alimentado: alimentado ? alimentado(c) : true });
    dormiram.push(c);
  }
  const aliviados = vivos.filter((c) => nivelDeExaustao(c) < antes.get(c));
  const cansados = vivos.filter((c) => nivelDeExaustao(c) > 0);
  await narrar(root, {
    formato: 'tela',
    paginas: [{
      titulo,
      texto: [
        ...(texto ?? ['Oito horas: uma refeição quente, turnos de vigia, sono.']),
        dormiram.length
          ? `${dormiram.map((c) => c.name).join(', ')} ${dormiram.length > 1 ? 'acordam' : 'acorda'} com a vida cheia, os espaços de magia e os recursos de volta, e metade dos dados de vida gastos.`
          : null,
        soCurto.length
          ? `${soCurto.map((c) => c.name).join(' e ')} ${soCurto.length > 1 ? 'passaram' : 'passou'} metade da noite de vigia: quatro horas não cabem nas duas de atividade leve, então ${soCurto.length > 1 ? 'ficam' : 'fica'} só com o que volta num descanso curto.`
          : null,
        aliviados.length ? `A noite desfaz um degrau de cansaço de ${aliviados.map((c) => c.name).join(', ')}.` : null,
        cansados.length ? `Ainda exausto: ${cansados.map((c) => `${c.name} (${nivelDeExaustao(c)})`).join(', ')}.` : null,
      ].filter(Boolean),
    }],
  });
  return ['O grupo termina um descanso longo: vida, magia e recursos de volta.',
    ...(cansados.length ? [`Exaustão ainda em ${cansados.map((c) => `${c.name} ${nivelDeExaustao(c)}`).join(', ')}.`] : [])];
}

/**
 * A tela do descanso curto de quem joga de fora: a mesma tabela do anfitrião, desenhada dos dados que ele manda; só os heróis DESTE
 * jogador têm botões (gastar um dado, rezar). Fechar a página (o botão "Estou pronto") avisa o anfitrião.
 * Devolve `{ atualizar(estado), fim }`: `fim` é a promessa da página (resolve quando o jogador fica pronto ou o anfitrião fecha).
 */
export function telaDoDescansoRemoto(root, { titulo, texto, ehMeu, aoGastar, aoMagia, sinal = null, narrarFn = narrar }) {
  const corpo = el('div', { class: 'descanso' });
  let ultimoEstado = null;
  const desenhar = (e) => {
    ultimoEstado = e;
    corpo.replaceChildren(...e.linhas.map((d) => {
      const meu = ehMeu(d.heroi);
      const frac = Math.max(0, Math.min(1, d.hp / (d.maxHp || 1)));
      const vida = el('div', { class: 'descanso-vida' }, el('i', { style: { width: `${Math.round(frac * 100)}%` } }), el('span', {}, `${Math.max(0, d.hp)}/${d.maxHp} PV`));
      const botao = el('button', {
        class: 'descanso-gastar', disabled: !meu || d.restam <= 0 || d.hp >= d.maxHp,
        title: !meu ? 'a escolha é do dono do herói' : d.restam <= 0 ? 'sem dados de vida' : d.hp >= d.maxHp ? 'vida cheia' : '',
        onclick: () => { audio.play('click'); aoGastar(d.heroi); },
      }, 'Gastar 1 dado');
      const magias = el('span', { class: 'descanso-oracao' }, ...d.magias.map((m) => el('span', { class: 'descanso-magia' },
        el('strong', {}, m.nome),
        el('small', {}, m.ganho),
        ...m.slots.map((restam, n) => (n >= m.minimo ? el('button', {
          class: 'descanso-gastar descanso-orar', disabled: !meu || restam <= 0,
          title: restam > 0 ? `${m.descricao}; gasta um espaço de ${n}º círculo (restam ${restam})` : `sem espaço de ${n}º círculo`,
          onclick: () => { audio.play('click'); aoMagia(d.heroi, m.id, n); },
        }, `${n}º ×${restam}`) : null)))));
      return el('div', { class: 'descanso-linha' },
        el('span', { class: 'descanso-retrato' }, retrato(d.look)),
        el('div', { class: 'descanso-quem' }, el('strong', {}, d.nome), el('small', {}, [d.className, d.caido ? 'caído, estável' : ''].filter(Boolean).join(' · '))),
        vida, el('span', { class: 'descanso-dados' }, `${d.restam}× d${d.lados}`), botao, el('span', { class: 'descanso-ultimo' }, d.ultimo), magias);
    }));
  };
  const fim = narrarFn(root, {
    formato: 'tela', sinal,
    paginas: [{ titulo, texto: texto ?? ['Uma hora de pausa.'], conteudo: el('div', {}, el('p', { class: 'descanso-topo' }, 'Cada jogador gasta os dados de vida do seu herói. Quando terminar, feche com "Estou pronto".'), corpo) }],
    escolhas: [{ rotulo: 'Estou pronto', valor: 'ok', primaria: true }],
  });
  return { atualizar: desenhar, fim, estado: () => ultimoEstado };
}
