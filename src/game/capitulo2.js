// Capítulo 2 da campanha: o esconderijo dos goblins (`game/esconderijo.js`).
//
// Conferido com a descrição de cada área na aventura. As REGRAS de cada sala
// seguem o livro (números, testes, quem está onde); o TEXTO é nosso.
//
//   a trilha    duas armadilhas no caminho: um laço (Percepção passiva 12) e
//               um fosso coberto (passiva 15). Quem vai na frente arrisca.
//   área 1      o grupo chega de dia. O caminho seco entra pelo lado direito
//               do riacho.
//   área 2      dois vigias preguiçosos num posto de ripas no meio do mato.
//               Notam o grupo quando alguém atravessa para o lado leste do
//               riacho (ninguém surpreso — ou eles, se quem atravessa passar
//               na Furtividade). Barulho lá fora (descansar ali) os faz
//               atacar primeiro.
//   área 3      três lobos acorrentados; não alcançam os degraus. Lidar com
//               Animais CD 15 (10 com comida) acalma. Vendo alguém fora do
//               alcance, puxam a corrente: Força CD 15, depois CD 10, e
//               soltam. No fundo, a chaminé de 9 m até a área 8 (Atletismo
//               CD 10).
//   área 4      a passagem do oeste é entulho, e o ressalto do meio é frágil:
//               quem passa de 45 kg o quebra (Destreza CD 10, 2d6 e cai).
//   área 5      um goblin escondido na ponte. Visto só com Percepção contra a
//               Furtividade dele; nota quem traz luz ou chega sem cuidado.
//               Quando nota, dá o sinal aos poços e atira azagaias; dois
//               turnos dos goblins depois, desce a ENCHENTE pelo túnel.
//   área 6      cinco goblins junto ao fogo na parte baixa, Yeemik em cima com
//               Sildar amarrado (1 PV). Quando o grupo está ganhando, Yeemik
//               pede trégua com a faca no pescoço do refém e propõe a cabeça
//               de Klarg. Recusado, joga Sildar do ressalto. Mesmo com Klarg
//               morto, cobra resgate.
//   área 7      três goblins. Começada a luta ali, um corre avisar Klarg.
//   área 8      Klarg, o lobo Serrote e dois goblins. Avisado, arma a
//               emboscada; desavisado, pode ser surpreendido — ainda mais por
//               quem sobe pela chaminé. Morto o Serrote, Klarg foge pela
//               chaminé. O baú está escondido entre os suprimentos.
//
// Cada sala é um GRUPO que só entra no tabuleiro quando é visto ou nota um
// herói (`depoisDeMover`); a luta acaba quando aquele grupo cai.
//
// Mesma interface de cena do capítulo 1 (`main.js` conversa com ela por
// `explorando`, `interacoes`, `depoisDeMover`, `fimDoCombate`, `evento` e os
// ganchos de conversa e descanso).
//
// TEXTO NOSSO. Yeemik, Klarg, Sildar e os outros nomes do cenário entram pela
// Fan Content Policy; nenhuma fala ou descrição é do livro, nem parafraseada.

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { abilityMod, skillBonus, passivePerception, SKILL_NAME } from '../rules/abilities.js';
import { distanceFt, Battlefield, SUPERFICIES } from '../core/grid.js';
import { podeVer, visaoNoEscuro, emiteLuz } from '../rules/luz.js';
import { addCondition, hasCondition } from '../rules/conditions.js';
import { darXp, proximoNivelEm } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';

const MOVIMENTO = 60;

const SALAS = {
  vigias: { nome: 'o posto dos vigias', em: 'no mato' },
  canil: { nome: 'o canil', em: 'no canil' },
  ponte: { nome: 'a ponte', em: 'na ponte' },
  covil: { nome: 'o covil', em: 'no covil' },
  pocos: { nome: 'os poços', em: 'nos poços' },
  chefe: { nome: 'a caverna de Klarg', em: 'na caverna de Klarg' },
};

// O riacho lá fora, linha por linha (a coluna da margem oeste dele): quem
// pisa nele ou além está atravessando para o lado dos vigias.
const RIACHO_FORA = { 16: 14, 17: 14, 18: 15, 19: 14, 20: 14, 21: 13, 22: 13, 23: 12, 24: 12, 25: 11, 26: 11, 27: 10 };
// Só lá fora (e na boca): dentro da caverna, leste do riacho é outra coisa.
const atravessou = (p) => (p.y >= 16 && p.x >= RIACHO_FORA[p.y] && p.x <= 26)
  || (p.y >= 13 && p.y <= 17 && p.x >= 13 && p.x <= 19);

// A passagem por onde a enchente desce: o túnel do riacho, a curva, o canal
// embaixo da ponte e os degraus do canil. Quem está na ponte ou no canil
// propriamente dito fica fora.
const naPassagem = (field, p) => p.y >= 5 && p.y <= 17 && p.x >= 13 && p.x <= 26
  && field.heightAt(p.x, p.y) <= 1 && !(p.x >= 20 && p.y >= 9);

const RESSALTO = [{ x: 11, y: 5 }, { x: 11, y: 6 }];       // área 4
const CHAMINE_BASE = { x: 25, y: 13 };                     // área 3
const CHAMINE_TOPO = { x: 28, y: 16 };                     // área 8
const DENTRO_DO_KLARG = (p) => p.x >= 27 && p.y >= 14;
const pequeno = (c) => /halfling|pequenin|gnom/i.test(`${c.ancestry ?? ''} ${c.raca ?? ''}`);

export function criarCapitulo2(app, config) {
  const enc = app.enc;
  const root = app.root;
  const todos = app.inimigosEscondidos;
  const grupos = {};
  for (const f of todos) (grupos[f.grupo] ??= { id: f.grupo, membros: [], ativo: false, vencido: false }).membros.push(f);
  for (const g of Object.values(grupos)) {
    g.furtividade = g.membros.filter((f) => f.side === 'foes').map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total);
  }
  const yeemik = grupos.covil.membros.find((f) => f.defId === 'yeemik');
  const sildar = grupos.covil.membros.find((f) => f.npcId === 'sildar');
  const klarg = grupos.chefe.membros.find((f) => f.defId === 'klarg');
  const serrote = grupos.chefe.membros.find((f) => f.name === 'Serrote');
  const estado = {
    explorando: false, encerrado: false, lutando: null,
    acordo: false, sildarLivre: false, tregua: false, tregaFeita: false,
    enchente: null, enchentes: 0, klargAvisado: false, subiuChamine: false,
    ressaltoQuebrado: false, bauAchado: false, klargFugiu: false,
  };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const hostis = (g) => g.membros.filter((f) => f.side === 'foes' && !f.dead && !f.fugiu);
  const pendentes = () => Object.values(grupos).filter((g) => !g.ativo && !g.vencido && !g.tregua && hostis(g).length);
  const guardar = (c, id, qtd) => {
    const b = (c.bag ??= []).find((i) => i.id === id);
    if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
  };
  const teste = (c, pericia, cd) => {
    const r = d20(enc.rng, skillBonus(c, pericia));
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    enc.surpresos = new Set();
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    estado.lutando = null;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function trazer(g) {
    if (g.ativo) return;
    g.ativo = true;
    for (const f of g.membros) {
      if (enc.combatants.includes(f)) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
  }

  /**
   * Começa a luta com um grupo. `surpresa`: 'deles' (eles emboscam), 'nossa'
   * (o grupo de heróis os pega desprevenidos) ou null.
   */
  async function combate(g, surpresa = null) {
    trazer(g);
    estado.explorando = false;
    estado.lutando = g;
    root.classList.remove('explorando');
    if (g.id === 'pocos') estado.klargAvisado = true;      // um goblin corre avisar Klarg
    enc.emboscada = surpresa === 'deles'
      ? { emboscadores: 'foes', furtividade: g.furtividade }
      : surpresa === 'nossa'
        ? { emboscadores: 'party', furtividade: herois().map((h) => d20(enc.rng, skillBonus(h, 'furtividade')).total) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  const asArmas = (texto) => narrar(root, {
    formato: 'painel',
    paginas: [{ texto: [].concat(texto) }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
  });

  // ---------------------------------------------------------- a trilha ----
  /** As duas armadilhas da trilha, para quem vai na frente. */
  async function armadilhas() {
    const frente = herois()[0];
    if (!frente) return;
    // Com o goblin capturado guiando, o grupo desvia das armadilhas.
    if (app.campanha?.capitulo1?.guia) {
      await narrar(root, { formato: 'painel', paginas: [{ texto: [
        'O goblin amarrado vai na frente, puxado pela corda, e aponta com o queixo: ali um laço escondido nas folhas, mais adiante um fosso coberto. Vocês desviam dos dois.'] }] });
      return;
    }
    const paginas = [];
    // O laço.
    const vLaco = passivePerception(frente) >= 12 || teste(frente, 'percepcao', 12).passou;
    if (vLaco) {
      paginas.push({ texto: [`Uns dez minutos de trilha adentro, ${frente.name} para e aponta: um laço de corda escondido nas folhas, amarrado a um galho vergado. Vocês desarmam e seguem.`] });
    } else {
      const r = enc.resistencia(frente, 'dex', 10);
      paginas.push({ texto: [r.success
        ? `O chão estala sob o pé de ${frente.name} e um laço salta das folhas — ${frente.name} pula para trás a tempo.`
        : `Um laço se fecha no tornozelo de ${frente.name} e o puxa de cabeça para baixo, três metros acima da trilha. Os outros cortam a corda segurando ${frente.name}, e ninguém cai.`] });
    }
    // O fosso.
    const vFosso = passivePerception(frente) >= 15 || teste(frente, 'percepcao', 15).passou;
    if (vFosso) {
      paginas.push({ texto: [`Mais adiante, ${frente.name} desconfia de um trecho de folhas arrumado demais: debaixo, um fosso de três metros. Vocês o contornam.`] });
    } else {
      const r = enc.resistencia(frente, 'dex', 10);
      if (r.success) {
        paginas.push({ texto: [`As folhas cedem sob ${frente.name}: um fosso! ${frente.name} se agarra na beirada e sai.`] });
      } else {
        const dano = enc.rng.die(6);
        enc.applyDamage(frente, dano, 'contundente');
        enc.say('dano', `${frente.name} cai no fosso da trilha: ${dano} de dano.`);
        paginas.push({ texto: [`As folhas cedem e ${frente.name} despenca num fosso de três metros (${dano} de dano). As paredes não são íngremes; sair dá só trabalho.`] });
      }
    }
    await narrar(root, { formato: 'painel', paginas });
  }

  async function abertura() {
    await narrar(root, {
      formato: 'tela',
      paginas: [{
        titulo: 'A trilha dos goblins',
        texto: [
          'A trilha corre para noroeste pelo mato, uns sete quilômetros. Pegadas pequenas, muitas, indo e vindo — e o rastro de dois corpos grandes arrastados.',
          `${herois()[0]?.name ?? 'Quem vai na frente'} vai na frente, de olho no chão.`,
        ],
      }],
    });
    await armadilhas();
  }

  async function chegada() {
    const semVisao = herois().filter((c) => !visaoNoEscuro(c)).map((c) => c.name);
    await narrar(root, {
      formato: 'painel',
      paginas: [{
        texto: [
          'A trilha acaba numa caverna larga no pé de um morro, cercada de mato fechado. Um riacho sai lá de dentro; do lado direito dele, uma faixa estreita de chão seco leva para a boca.',
          semVisao.length
            ? `Lá dentro é breu. ${semVisao.length > 1 ? `${semVisao.slice(0, -1).join(', ')} e ${semVisao.at(-1)} não enxergam` : `${semVisao[0]} não enxerga`} no escuro: botão direito num herói acende a tocha — que também mostra o grupo a quem está no escuro.`
            : 'Lá dentro é breu, mas todos aqui enxergam no escuro até 60 pés.',
        ],
      }],
    });
  }

  // ------------------------------------------------------------ quem vê ----
  const nota = (f, c) => podeVer(enc, f, c) && (emiteLuz(c) || distanceFt(f.pos, c.pos) <= 30);

  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    if (await ressalto(c)) return;
    if (estado.enchente) { await enchente(); if (!estado.explorando) return; }
    for (const g of pendentes()) {
      if (g.id === 'vigias') { if (await vigias(g, c)) return; continue; }
      if (g.id === 'ponte') { if (await ponte(g)) return; continue; }
      if (g.id === 'chefe' && estado.klargAvisado) {
        // Avisado, Klarg se esconde atrás das estalagmites e espera.
        const entrou = herois().find((h) => DENTRO_DO_KLARG(h.pos));
        if (entrou) {
          await asArmas(`${entrou.name} mal pisa na caverna e uma sombra enorme se levanta atrás de uma estalagmite: Klarg estava esperando.`);
          await combate(g, 'deles');
          return;
        }
        continue;
      }
      const visto = hostis(g).find((f) => herois().some((h) => podeVer(enc, h, f)));
      if (visto) {
        const quem = herois().find((h) => podeVer(enc, h, visto));
        const nossa = g.id === 'chefe';     // desavisado, Klarg pode ser surpreendido
        await asArmas([
          visaoNoEscuro(quem) && !emiteLuz(quem)
            ? `No cinza da visão no escuro, ${quem.name} vê movimento ${SALAS[g.id].em}: ${visto.name}${hostis(g).length > 1 ? ', e não está sozinho' : ''}.`
            : `A luz alcança ${SALAS[g.id].nome} e pega ${visto.name} desprevenido.`,
          nossa ? 'Eles ainda não perceberam vocês.' : 'Ninguém é surpreendido.',
        ]);
        await combate(g, nossa ? 'nossa' : null);
        return;
      }
      const notou = hostis(g).find((f) => herois().some((h) => nota(f, h)));
      if (notou) {
        const alvo = herois().find((h) => nota(notou, h));
        await asArmas(emiteLuz(alvo)
          ? `Do fundo do escuro, um grito agudo — a tocha de ${alvo.name} entregou o grupo antes de alguém ver qualquer coisa.`
          : `Alguma coisa raspa na pedra, perto. ${alvo.name} não vê nada — mas alguma coisa no escuro vê ${alvo.name}.`);
        await combate(g, g.id === 'chefe' && estado.subiuChamine ? 'nossa' : 'deles');
        return;
      }
    }
  }

  // ------------------------------------------------------------- área 2 ----
  async function vigias(g, c) {
    if (!atravessou(c.pos)) return false;
    // Quem atravessa com cuidado pode pegar os vigias distraídos.
    const r = d20(enc.rng, skillBonus(c, 'furtividade'));
    const atencao = Math.max(...hostis(g).map((f) => passivePerception(f)));
    const furtivo = r.total > atencao;
    await asArmas(furtivo
      ? [`${c.name} atravessa o riacho sem barulho e vê, entre o mato, um abrigo de ripas: dois goblins ali, um cochilando, o outro coçando a orelha.`,
        `Furtividade ${r.total}: os vigias não perceberam nada.`]
      : [`${c.name} atravessa o riacho e um galho estala. Do meio do mato, atrás de umas ripas de madeira, dois goblins se levantam de arco na mão.`,
        'Ninguém é surpreendido.']);
    await combate(g, furtivo ? 'nossa' : null);
    return true;
  }

  /** Barulho lá fora (descansar ali) chama os vigias, que atacam primeiro. */
  async function barulhoLaFora() {
    const g = grupos.vigias;
    if (!pendentes().includes(g) || !herois().every((h) => h.pos.y >= 16)) return false;
    await asArmas('Uma hora de conversa e panelas batendo é demais até para goblins preguiçosos: uma flecha sai do mato a leste do riacho, e outra.');
    await combate(g, 'deles');
    return true;
  }

  // ------------------------------------------------------------- área 3 ----
  /** Os lobos acorrentados puxam a corrente quando veem alguém fora do alcance. */
  enc.antesDoTurno = (m) => {
    if (m.corrente && !m.dead) {
      const alcanca = herois().some((h) => distanceFt(m.corrente, h.pos) <= m.corrente.raioFt + 5);
      const ve = herois().some((h) => podeVer(enc, m, h));
      if (alcanca || !ve) return false;
      const cd = m.correnteCD ?? 15;
      const r = d20(enc.rng, abilityMod(m.abilities.str));
      if (r.total >= cd) {
        if (cd === 15) {
          m.correnteCD = 10;
          enc.say('acao', `${m.name} se joga contra a corrente (Força ${r.total}): o espeto de ferro afrouxa na pedra.`);
        } else {
          m.corrente = null;
          enc.say('acao', `${m.name} arranca o espeto do chão (Força ${r.total}) e está solto!`);
        }
      } else {
        enc.say('acao', `${m.name} puxa a corrente, rosnando (Força ${r.total} contra CD ${cd}).`);
      }
      return true;
    }
    // Klarg fugindo pela chaminé (morto o Serrote).
    if (m === klarg && klarg.fugindo && !klarg.dead) return fugirPelaChamine();
    return false;
  };

  function acalmarLobos(c) {
    const g = grupos.canil;
    const comida = (c.bag ?? []).find((i) => i.id === 'racoes' && i.qtd > 0);
    const cd = comida ? 10 : 15;
    return async () => {
      if (comida) comida.qtd -= 1;
      const t = teste(c, 'lidarComAnimais', cd);
      enc.say('acao', `${c.name} · Lidar com Animais: ${t.total} contra CD ${cd} — ${t.passou ? 'sucesso' : 'falha'}`);
      if (t.passou) {
        g.tregua = true;
        for (const f of g.membros) f.side = 'neutro';
        trazer(g);
        await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [comida
          ? `${c.name} joga a carne seca e fala baixo. Os lobos brigam pela comida, cheiram a mão estendida e deitam. Dá para passar.`
          : `${c.name} se agacha, fala baixo e não desvia o olhar. Os lobos param de rosnar, um por um. Dá para passar.`] }] });
        app.refresh();
      } else {
        await asArmas(`Os lobos não querem conversa: avançam até onde a corrente deixa, babando.`);
        await combate(g, null);
      }
    };
  }

  async function chamine(c, subir) {
    const t = teste(c, 'atletismo', 10);
    if (t.passou) {
      const destino = casaPerto(subir ? CHAMINE_TOPO : CHAMINE_BASE);
      c.pos = { ...c.pos, x: destino.x, y: destino.y };
      if (subir) estado.subiuChamine = true;
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [subir
        ? `${c.name} escala a chaminé apertada, nove metros de pedra úmida, e sai por uma abertura no lado oeste de uma caverna grande.`
        : `${c.name} desce a chaminé e chega ao fundo do canil, entre o lixo jogado lá de cima.`] }] });
    } else if (t.total >= 6) {
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [`${c.name} não acha onde segurar e não sai do lugar.`] }] });
    } else {
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'contundente');
      if (!c.dead) addCondition(c, 'caido');
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [`A pedra solta escorrega e ${c.name} cai no fundo da chaminé: ${dano} de dano.`] }] });
    }
    app.refresh();
    await depoisDeMover(c);
  }

  // ------------------------------------------------------------- área 4 ----
  /** O ressalto frágil da passagem do oeste. */
  async function ressalto(c) {
    if (estado.ressaltoQuebrado || pequeno(c) || !RESSALTO.some((p) => p.x === c.pos.x && p.y === c.pos.y)) return false;
    estado.ressaltoQuebrado = true;
    const r = enc.resistencia(c, 'dex', 10);
    const dano = enc.rng.die(6) + enc.rng.die(6);
    const levou = r.success ? Math.floor(dano / 2) : dano;
    enc.applyDamage(c, levou, 'contundente');
    if (!r.success && !c.dead) addCondition(c, 'caido');
    const baixo = casaPerto({ x: 13, y: 6 });
    c.pos = { ...c.pos, x: baixo.x, y: baixo.y };
    enc.say('dano', `O ressalto cede sob ${c.name}: ${levou} de dano (Destreza ${r.total}).`);
    await narrar(root, { formato: 'painel', paginas: [{ texto: [
      `A laje onde ${c.name} pisa racha com um estalo e desce rolando junto com o entulho, até o pé da passagem (${levou} de dano${r.success ? '' : ', e no chão'}).`,
    ] }] });
    app.refresh();
    return false;
  }

  // ------------------------------------------------------------- área 5 ----
  /** O goblin da ponte: escondido, só visto com Percepção contra a Furtividade dele. */
  async function ponte(g) {
    const goblin = hostis(g)[0];
    if (!goblin) return false;
    const furt = g.furtividade[0];
    const visto = herois().find((h) => podeVer(enc, h, goblin) && passivePerception(h) >= furt);
    const notou = herois().find((h) => nota(goblin, h));
    if (!visto && !notou) return false;
    if (notou && !estado.enchentes) estado.enchente ??= { turnos: 2 };
    await asArmas(notou
      ? [`No alto, sobre uma ponte frágil de madeira e corda seis metros acima do riacho, um goblin assobia três vezes para o fundo da caverna e puxa uma azagaia.`,
        visto ? 'Vocês o viram ao mesmo tempo.' : 'Ele viu vocês primeiro.']
      : [`${visto.name} distingue, lá no alto, uma ponte frágil de madeira e corda — e um goblin deitado nela, de olho no riacho.`]);
    await combate(g, notou && !visto ? 'deles' : null);
    return true;
  }

  /**
   * A enchente: desce dos poços pelo túnel até a boca. Pode haver uma
   * segunda, só por ordem do goblin da ponte, e só se a primeira não varreu
   * todos os intrusos da passagem.
   */
  async function enchente() {
    if (!estado.enchente || estado.enchentes >= 2) return;
    estado.enchente = null;
    estado.enchentes += 1;
    const linhas = [];
    for (const c of enc.combatants.filter((x) => !x.dead && naPassagem(enc.field, x.pos))) {
      const r = enc.resistencia(c, 'dex', 10);
      if (r.success) { linhas.push(`${c.name} sai da frente da água (Destreza ${r.total}).`); continue; }
      const f = enc.resistencia(c, 'str', 15);
      if (f.success) { linhas.push(`${c.name} se agarra na pedra e aguenta (Força ${f.total}).`); continue; }
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'contundente');
      if (!c.dead) {
        addCondition(c, 'caido');
        const fora = casaPerto({ x: 16, y: 19 });
        c.pos = { ...c.pos, x: fora.x, y: fora.y };
      }
      linhas.push(`${c.name} é arrastado pela água até a boca da caverna: ${dano} de dano.`);
    }
    for (const t of linhas) enc.say('dano', t);
    esvaziarPoco(estado.enchentes);
    const sentinela = hostis(grupos.ponte)[0];
    if (estado.enchentes === 1 && sentinela && herois().some((h) => naPassagem(enc.field, h.pos))) {
      estado.enchente = { turnos: 2 };
      linhas.push('Lá em cima, o goblin da ponte olha a passagem, vê que ainda tem gente ali e assobia de novo.');
    }
    await narrar(root, { formato: 'painel', paginas: [{ texto: [
      'Lá do fundo, um estalo de pedra e o barulho cresce até virar rugido: uma onda escura desce pelo túnel, arrastando cascalho.',
      ...(linhas.length ? linhas : ['Ninguém estava no caminho da água.']),
    ] }] });
    app.refresh();
  }

  /** Cada enchente esvazia um tanque: o de baixo primeiro, depois o de cima. */
  function esvaziarPoco(qual) {
    const f = enc.field;
    const chao = SUPERFICIES.indexOf('caverna');
    const [x0, x1, y0, y1] = qual === 1 ? [27, 30, 5, 6] : [30, 37, 1, 7];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * f.w + x;
        if (f.surfaceAt(x, y) === 'poco') { f.surfaces[i] = chao; f.tiles[i] = 0; }
      }
    }
  }

  // ------------------------------------------------------------- área 6 ----
  /** No meio da luta do covil, perdendo, Yeemik pede trégua com a faca no refém. */
  async function tregua() {
    estado.tregaFeita = true;
    const fim = await app.conversarCom(yeemik, arvoreYeemik('tregua'));
    await depoisDoYeemik(fim);
  }

  async function depoisDoYeemik(fim) {
    const g = grupos.covil;
    if (fim === 'acordo' || fim === 'paz' || fim === 'solto' || fim === 'pago') {
      if (fim === 'acordo') estado.acordo = true;
      if (fim === 'solto' || fim === 'pago') libertarSildar(fim === 'pago'
        ? 'Yeemik conta as moedas duas vezes, corta a corda de Sildar e o empurra escada abaixo.'
        : 'Yeemik corta a corda de Sildar com o punhal e o empurra escada abaixo.');
      g.tregua = true;
      for (const f of hostis(g)) f.side = 'neutro';
      // No meio da luta, a trégua a encerra: sem inimigo de pé, o motor fecha.
      if (estado.lutando === g && !enc.over) { enc.checkEnd(); return; }
      if (podeEncerrar()) { await fimDoCapitulo(['Vocês saem do covil com Sildar entre vocês. Atrás, Yeemik já grita ordens aos goblins que sobraram.']); return; }
      if (!estado.lutando) prepararExploracao();
      return;
    }
    // Recusa: Yeemik joga Sildar do ressalto.
    for (const f of g.membros) if (f.side === 'neutro' && f !== sildar) f.side = 'foes';
    g.tregua = false;
    if (sildar && !estado.sildarLivre && !sildar.dead) {
      const dano = enc.rng.die(6);
      sildar.hp = 0;
      sildar.stable = false;
      addCondition(sildar, 'inconsciente');
      const baixo = casaPerto({ x: 4, y: 7 });
      sildar.pos = { ...sildar.pos, x: baixo.x, y: baixo.y };
      enc.say('dano', `Yeemik joga Sildar do alto do ressalto: ${dano} de dano. Sildar está morrendo — estabilize-o.`);
    }
    if (estado.lutando !== g) await combate(g, null);
    app.refresh();
  }

  /** Klarg resolvido, o baú achado e Sildar fora das mãos de Yeemik (livre ou morto). */
  const podeEncerrar = () => grupos.chefe.vencido && estado.bauAchado
    && (estado.sildarLivre || !sildar || sildar.dead) && !estado.encerrado;

  function libertarSildar(texto) {
    if (!sildar || estado.sildarLivre) return;
    estado.sildarLivre = true;
    if (texto) enc.say('acao', texto);
    const lugar = casaPerto({ x: 4, y: 7 });
    sildar.pos = { ...sildar.pos, x: lugar.x, y: lugar.y };
    sildar.refem = false;
    app.refresh();
  }

  function ouroDoGrupo() {
    return herois().reduce((s, h) => s + ((h.bag ?? []).find((i) => i.id === 'moedaDeOuro')?.qtd ?? 0), 0);
  }
  function pagar(qtd) {
    let falta = qtd;
    for (const h of herois()) {
      const m = (h.bag ?? []).find((i) => i.id === 'moedaDeOuro');
      if (!m || falta <= 0) continue;
      const tira = Math.min(m.qtd, falta);
      m.qtd -= tira;
      falta -= tira;
    }
  }

  // O resgate que Yeemik cobra é nosso número: a aventura só diz que é alto.
  const RESGATE = 50;

  function arvoreYeemik(inicio) {
    return {
      inicio,
      nos: {
        tregua: {
          narra: 'O goblin magro lá em cima agarra o homem amarrado pelos cabelos, arrasta-o até a beira do ressalto e encosta o punhal no pescoço dele. Os goblins de baixo param, ofegantes.',
          fala: [
            'Trégua! Trégua, ou o humano morre!',
            'Yeemik não quer briga com vocês. Yeemik quer o lugar de Klarg, o grandalhão fedido que manda aqui. Tragam a cabeça de Klarg e o humano é de vocês.',
          ],
          opcoes: [
            { texto: 'Combinado. Onde está o Klarg?', vai: 'acordo' },
            { texto: 'Solte o homem agora, como prova. A gente cuida do Klarg de qualquer jeito.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'solta', falha: 'nao' },
            { texto: 'Solte ele, ou ninguém nesta sala vê o sol de novo.', teste: { pericia: 'intimidacao', cd: 15 }, sucesso: 'solta', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        acordo: {
          narra: 'Do chão, com a boca inchada, o homem amarrado murmura: — Não confiem nele.',
          fala: 'Gente esperta! Klarg mora no fundo, no leste, depois dos poços. Voltem com a cabeça e o humano é de vocês.',
          fim: 'acordo',
        },
        nao: {
          fala: 'Prova? Yeemik é que quer prova. Cabeça primeiro, humano depois.',
          opcoes: [
            { texto: 'Está bem. Combinado.', vai: 'acordo' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        solta: {
          fala: 'Tá, tá! Leva o velho. Mas a cabeça continua valendo, ouviu? Yeemik espera.',
          fim: 'solto',
        },
        furia: {
          narra: 'Os olhos de Yeemik se apertam.',
          fala: 'Ninguém ameaça Yeemik na casa de Yeemik!',
          fim: 'luta',
        },
        espera: {
          fala: 'Ainda aqui? A cabeça, a cabeça! Klarg está no fundo, no leste.',
          opcoes: [
            { texto: 'Já vamos.', fim: 'paz' },
            { texto: 'Mudamos de ideia. Atacar.', fim: 'luta' },
          ],
        },
        volta: {
          narra: 'Yeemik desce a escada aos pulos quando vê o que vocês carregam — e para, sorrindo demais.',
          fala: [
            'Klarg morto! Agora Yeemik é o chefe!',
            `Mas o humano… o humano comeu a comida de Yeemik. Bebeu a água de Yeemik. Isso custa. ${RESGATE} peças de ouro, e ele é de vocês.`,
          ],
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'O acordo era a cabeça. Solte ele.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'cede', falha: 'teima' },
            { texto: 'Solte ele, ou você vai junto com o Klarg.', teste: { pericia: 'intimidacao', cd: 12 }, sucesso: 'cede', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        semCabeca: {
          fala: 'Klarg fugiu? Sem cabeça, sem humano! Yeemik não é bobo.',
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'Solte ele, ou você vai atrás do Klarg.', teste: { pericia: 'intimidacao', cd: 15 }, sucesso: 'cede', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        adeus: {
          fala: 'O humano já é de vocês. Agora saiam da casa de Yeemik, antes que Yeemik mude de ideia.',
          opcoes: [
            { texto: 'Ir embora.', fim: 'paz' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        cede: {
          fala: 'Tá bom, tá bom! Leva! Yeemik é generoso, Yeemik é o chefe!',
          fim: 'solto',
        },
        teima: {
          fala: `Acordo é acordo, e o preço é ${RESGATE}. Ou nada de humano.`,
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
      },
    };
  }

  // ------------------------------------------------------------- área 8 ----
  /** Klarg corre para a chaminé; chegando nela, some. Devolve true se gastou o turno. */
  function fugirPelaChamine() {
    if (distanceFt(klarg.pos, CHAMINE_TOPO) <= 5) {
      klarg.fugiu = true;
      estado.klargFugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(klarg), 1);
      enc.say('acao', 'Klarg se espreme pela chaminé do oeste e desaparece no escuro, xingando.');
      enc.checkEnd();
      app.refresh();
      return true;
    }
    const alcance = enc.reachableFor(klarg);
    let melhor = null;
    for (const n of alcance.values()) {
      if (enc.occupied(n.x, n.y, klarg)) continue;
      const d = distanceFt(n, CHAMINE_TOPO);
      if (!melhor || d < melhor.d) melhor = { n, d };
    }
    if (melhor && melhor.n.cost > 0) enc.moveAlong(klarg, Battlefield.pathFrom(alcance, melhor.n));
    return true;
  }

  function achouOBau(c) {
    estado.bauAchado = true;
    for (const [id, qtd] of [['moedaDeCobre', 600], ['moedaDePrata', 110], ['pocaoDeCura', 2], ['estatuetaDeSapo', 1]]) guardar(c, id, qtd);
    return narrar(root, { formato: 'painel', paginas: [{ texto: [
      `Entre sacos e caixotes com a marca de um leão azul, ${c.name} acha um baú destrancado: 600 peças de cobre, 110 de prata, duas poções de cura e um sapinho de jade com olhos de ouro.`,
      'O resto — comida, ferramentas, lonas — é muito para carregar sem uma carroça. A marca é de uma companhia mercante de Phandalin.',
    ] }] });
  }

  // ----------------------------------------------------------- eventos ----
  /**
   * A FOGUEIRA (covil e Klarg): brasa no chão. Quem entra leva 1 de dano de
   * fogo; quem cai em cima, 1d6. Cada um, no máximo uma vez por turno.
   */
  function fogueira(ev) {
    const turno = `${enc.round}:${enc.side}:${estado.explorando ? 'x' : 'c'}`;
    const naBrasa = (c) => enc.field.surfaceAt(c.pos.x, c.pos.y) === 'fogueira';
    if (ev.type === 'moved' && ev.actor && !ev.actor.dead && naBrasa(ev.actor) && ev.actor._brasa !== turno) {
      ev.actor._brasa = turno;
      enc.applyDamage(ev.actor, 1, 'fogo');
      enc.say('dano', `${ev.actor.name} pisa na brasa da fogueira: 1 de dano de fogo.`);
    }
    for (const c of enc.combatants) {
      if (c.dead || !naBrasa(c) || !hasCondition(c, 'caido') || c._brasaCaido === turno) continue;
      c._brasaCaido = turno;
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'fogo');
      enc.say('dano', `${c.name} está caído em cima da brasa: ${dano} de dano de fogo.`);
    }
  }

  /** O que o motor conta durante a luta (via `main.js`). */
  function evento(ev) {
    fogueira(ev);
    if (ev.type === 'died' && ev.target === serrote && klarg && !klarg.dead) {
      klarg.fugindo = true;
      enc.say('acao', 'Klarg vê o Serrote cair e ruge — e corre para a chaminé do oeste.');
    }
    if (ev.type === 'sideStart' && ev.side === 'foes' && estado.enchente) {
      estado.enchente.turnos -= 1;
      if (estado.enchente.turnos <= 0) setTimeout(() => enchente(), 0);
    }
    if (ev.type === 'sideStart' && ev.side === 'party' && estado.lutando === grupos.covil
      && !estado.tregaFeita && yeemik && !yeemik.dead && sildar && !sildar.dead && !estado.sildarLivre) {
      // "Ganhando": mais da metade dos goblins de baixo caiu.
      const caidos = grupos.covil.membros.filter((f) => f.defId === 'goblin' && (f.dead || hasCondition(f, 'inconsciente'))).length;
      if (caidos >= 3) setTimeout(() => tregua(), 0);
    }
  }

  // ------------------------------------------------------------ depois ----
  async function fimDoCombate(outcome) {
    const g = estado.lutando;
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'O escuro venceu', texto: ['O grupo caiu no esconderijo. Os goblins vão comer bem esta noite.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar o esconderijo de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config, pularAbertura: true, continuarCom: null });
      else app.encerrarPartida();
      return;
    }
    // A enchente já estava a caminho: desce mesmo que a luta tenha acabado.
    if (estado.enchente) await enchente();
    const texto = [];
    if (g?.tregua) {
      texto.push(estado.sildarLivre
        ? 'A trégua vale. Sildar está livre, e Yeemik ainda quer a cabeça de Klarg.'
        : 'A trégua vale: os goblins do covil abaixam as armas. Yeemik espera a cabeça de Klarg, com Sildar amarrado ao lado.');
    } else {
      if (g) g.vencido = true;
      if (g?.id === 'covil') {
        if (yeemik?.dead) {
          const quem = herois()[0];
          if (quem) { guardar(quem, 'denteDeOuro', 3); guardar(quem, 'moedaDePrata', 15); }
          texto.push(`Na algibeira de Yeemik: três dentes de ouro e 15 peças de prata.${quem ? ` ${quem.name} guarda.` : ''}`);
        }
        if (sildar && !sildar.dead) {
          libertarSildar(null);
          texto.push(sildar.hp > 0
            ? 'Vocês cortam as cordas de Sildar. Ele mal fica de pé, mas está vivo.'
            : 'Sildar está caído e desacordado, mas respira. Cortem as cordas e cuidem dele.');
        }
      } else if (g?.id === 'chefe') {
        texto.push(estado.klargFugiu
          ? 'Klarg escapou pela chaminé. A caverna é de vocês — e, entre os suprimentos, deve haver o que ele guardava.'
          : 'Klarg está morto. Entre os suprimentos empilhados no sul da caverna deve haver o que ele guardava.');
      } else {
        texto.push(`Silêncio ${SALAS[g?.id]?.em ?? 'na sala'} de novo.`);
      }
    }
    if (podeEncerrar()) {
      await fimDoCapitulo(texto);
      return;
    }
    texto.push('Dá para descansar agora (botão direito num herói) antes de seguir.');
    await narrar(root, { formato: 'painel', paginas: [{ texto }] });
    prepararExploracao();
  }

  async function fimDoCapitulo(texto) {
    estado.encerrado = true;
    const vivo = sildar && !sildar.dead;
    // O marco do livro: 275 XP para cada um ao limpar o esconderijo.
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    const sobem = darXp(grupo, 275);
    texto = [...texto, `Cada herói ganha 275 XP pelo esconderijo (agora ${grupo[0]?.xp ?? 0}).`];
    await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O esconderijo caiu', texto }] });
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
    app.campanha = {
      ...(app.campanha ?? {}),
      capitulo2: { sildar: vivo, acordoComYeemik: estado.acordo, klargFugiu: estado.klargFugiu, suprimentosDaCompanhia: true },
    };
    await narrar(root, {
      formato: 'tela',
      paginas: [
        {
          titulo: 'Fim do segundo capítulo',
          texto: [
            vivo
              ? 'Sildar Hallwinter, da Aliança dos Lordes, anda devagar, mas anda. Ele conta o que ouviu dos goblins: Gundren e o mapa dele foram levados ao Castelo Dentefino, a mando de alguém que chamam de Aranha Negra. Sildar oferece 50 peças de ouro para ser escoltado a Phandalin.'
              : 'Do anão, nenhum sinal: foi levado para outro lugar. A trilha volta para a estrada, e a estrada leva a Phandalin.',
            'Os suprimentos com a marca do leão azul ficam esperando uma carroça. A estrada leva a Phandalin.',
          ],
        },
      ],
      escolhas: [{ rotulo: 'Seguir para Phandalin', valor: 'vila', primaria: true }],
    });
    app.irParaVila(enc.combatants.filter((c) => c.side === 'party' && !c.dead), { chegando: true });
  }

  // --------------------------------------------------------- conversas ----
  const sildarArvore = {
    inicio: 'oi',
    nos: {
      oi: {
        fala: () => (estado.sildarLivre && sildar.hp > 0
          ? ['Sildar Hallwinter, da Aliança dos Lordes. Fico devendo a vida a vocês.',
            'Gundren e os irmãos acharam a entrada de uma mina perdida. Os goblins levaram ele e o mapa para um tal Castelo Dentefino, a mando de alguém que chamam de Aranha Negra.',
            'Em Phandalin eu devia encontrar um colega, um mago chamado Iarno Alberk. Ninguém tem notícia dele. Antes, porém, esta caverna precisa ficar limpa.']
          : ['…água. Alguém tem água?']),
        opcoes: [{ texto: 'Fique aqui. Voltamos para buscar você.', fim: 'paz' }],
      },
    },
  };

  function dialogoDe(npc) {
    if (npc === sildar) return sildarArvore;
    if (npc === yeemik && grupos.covil.tregua) {
      const inicio = estado.sildarLivre ? 'adeus'
        : estado.klargFugiu ? 'semCabeca' : grupos.chefe.vencido ? 'volta' : 'espera';
      return arvoreYeemik(inicio);
    }
    return null;
  }

  async function depoisDaConversa(npc, fim) {
    if (npc === yeemik) await depoisDoYeemik(fim);
  }

  // ------------------------------------------------------- botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);

    // Escutar: o barulho da água abafa tudo; Percepção CD 15 ouve as salas perto.
    if (sup === 'rocha') {
      ops.push({
        rotulo: 'Escutar', icone: 'acao-procurar', detalhe: 'Percepção, CD 15 · a água abafa tudo',
        fazer: async () => {
          const t = teste(c, 'percepcao', 15);
          const perto = pendentes().filter((g) => hostis(g).some((f) => distanceFt(f.pos, c.pos) <= 50));
          await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [t.passou
            ? (perto.length ? `Por baixo do barulho da água, ${c.name} distingue: ${perto.map((g) => ({ canil: 'correntes e rosnados', vigias: 'cochichos no mato', ponte: 'madeira rangendo lá em cima', covil: 'risadas e panela batendo', pocos: 'vozes perto de uma cachoeira', chefe: 'uma voz grossa falando de si mesma' }[g.id])).join('; ')}.` : `${c.name} escuta com atenção: só água.`)
            : `${c.name} só ouve água correndo.`] }] });
        },
      });
    }
    // Área 3: acalmar os lobos, e a chaminé.
    const g3 = grupos.canil;
    if (tile.x >= 18 && tile.x <= 25 && tile.y >= 10 && tile.y <= 15 && !g3.vencido && !g3.tregua) {
      const comida = (c.bag ?? []).some((i) => i.id === 'racoes' && i.qtd > 0);
      ops.push({
        rotulo: 'Acalmar os lobos', icone: 'acao-ajudar',
        detalhe: `Lidar com Animais, CD ${comida ? '10 (com comida)' : '15'}`,
        motivo: longe(30), fazer: acalmarLobos(c),
      });
    }
    if (sup === 'entulho' && tile.x === CHAMINE_BASE.x && tile.y === CHAMINE_BASE.y) {
      ops.push({ rotulo: 'Subir a chaminé', icone: 'acao-levantarSe', detalhe: 'Atletismo, CD 10 · 9 m até outra caverna', motivo: longe(5), fazer: () => chamine(c, true) });
    }
    if (sup === 'entulho' && tile.x === CHAMINE_TOPO.x && tile.y === CHAMINE_TOPO.y) {
      ops.push({ rotulo: 'Descer a chaminé', icone: 'acao-levantarSe', detalhe: 'Atletismo, CD 10 · 9 m até o canil', motivo: longe(5), fazer: () => chamine(c, false) });
    }
    // Área 8: o baú entre os suprimentos.
    if ((sup === 'mantimentos' || sup === 'bau') && DENTRO_DO_KLARG(tile) && !estado.bauAchado) {
      ops.push({
        rotulo: 'Revirar os suprimentos', icone: 'acao-procurar', detalhe: 'sacos e caixotes roubados',
        motivo: longe(5) ?? (pendentes().includes(grupos.chefe) ? 'Klarg ainda está aqui' : null),
        fazer: async () => {
          await achouOBau(c);
          if (podeEncerrar()) await fimDoCapitulo(['O esconderijo é de vocês.']);
        },
      });
    }
    // Lá fora: vasculhar o mato atrás dos vigias.
    const g2 = grupos.vigias;
    if ((sup === 'arbusto' || sup === 'espinheiro' || sup === 'tocaia') && pendentes().includes(g2)) {
      ops.push({
        rotulo: 'Vasculhar o mato', icone: 'acao-procurar', detalhe: 'Percepção contra a Furtividade deles',
        motivo: longe(30),
        fazer: async () => {
          const r = d20(enc.rng, skillBonus(c, 'percepcao'));
          const achou = r.total >= Math.min(...g2.furtividade);
          await asArmas([achou
            ? `${c.name} vê, entre o mato, ripas de madeira amarradas — e atrás delas dois goblins de arco.`
            : `${c.name} remexe o mato e não vê nada. Mas alguma coisa ali viu ${c.name}.`]);
          await combate(g2, achou ? null : 'deles');
        },
      });
    }
    return ops;
  }

  function motivoSemDescanso(tipo) {
    if (!estado.explorando) return 'só fora da luta';
    if (tipo === 'longo' && !grupos.chefe.vencido) return 'com Klarg lá dentro, ninguém dorme oito horas aqui';
    return null;
  }

  return {
    lugar: 'Esconderijo Dentefino',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    evento,
    dialogoDe,
    depoisDaConversa,
    motivoSemDescanso,
    textoDoDescanso: (tipo) => (tipo === 'curto'
      ? ['Uma hora encostados na rocha, longe da passagem, revezando quem fica de olho.']
      : ['Oito horas no fundo da caverna, com a fogueira de Klarg ainda em brasa e um de vocês sempre acordado.']),
    // Descansar lá fora faz barulho: os vigias atacam.
    depoisDoDescanso: () => barulhoLaFora(),
    async iniciar() {
      if (!config.pularAbertura) await abertura();
      prepararExploracao();
      await chegada();
      // O marco do livro: 75 XP para cada um ao achar o esconderijo (uma vez
      // por herói, mesmo tentando de novo).
      const grupo = herois().filter((c) => !c.marcos?.includes('esconderijo'));
      for (const c of grupo) (c.marcos ??= []).push('esconderijo');
      if (grupo.length) {
        darXp(grupo, 75);
        enc.say('cura', `Cada herói ganha 75 XP por achar o esconderijo (${grupo[0].xp} de ${proximoNivelEm(grupo[0]) ?? '—'} para o próximo nível).`);
      }
    },
  };
}
