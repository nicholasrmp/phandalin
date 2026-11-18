// A POÇA SALGADA (o Obelisco, capítulo 8, B22): nove quilômetros e meio de líquido de cérebro, do fundo do Labirinto
// Salgado até a estrela sem luz, a porta do Vazio Sem Fim.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - o líquido se respira, pesado, e a poça é penumbra; grumos de carne flutuam, alguns do tamanho de gente;
//   - um VERME PÚRPURA nada nela, a 15 m por turno, e sente quem nada perto;
//   - a cada MILHA de descida (seis), cada um faz Força (Atletismo) ou Destreza (Furtividade) CD 14 — com vantagem quem viu a
//     Poça pela ocular do Golcuus no capítulo 7 (`obelisco7.feito.viuAPiscinaSalobra`); quem falha, o verme acha;
//   - o verme bate e corre: sai do escuro, engole alguém e vai embora, e NUNCA fica mais de duas rodadas numa luta;
//   - no fundo, os pelos que ondulam e a estrela sem luz; chegar ali dá o 11º nível (o marco). O verme não usa o furo.
//
// A estrela sem luz leva ao Vazio Sem Fim (`vazio.js`), na Cúpula de Cristal.
//
// DECISÃO NOSSA, dita: o livro não diz o que acontece com quem está DENTRO do verme quando ele vai embora. Aqui ele se
// afasta com a pessoa (para longe do grupo, e de lá não volta) e quem está dentro continua lutando para sair — o vômito
// do livro, 30 de dano num turno e Constituição CD 21 — até sair ou cair. Saindo, nada de volta ao grupo.
//
// A luta é num poço de água aberta (o mapa daqui, sem arte), onde todos nadam. O estado mora em
// `app.campanha.obelisco8.poca`.

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { rolarPericia, SKILL_NAME } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { addCondition } from '../rules/conditions.js';
import { engolidosDe } from '../rules/livro-motor.js';
import { darMarco } from './obelisco5-vila.js';
import { darXp } from './nivel.js';
import { tirarVooDoVazio } from './vazio.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import * as Refens from './refens-obelisco.js';

const L = 26;
const MOVIMENTO = 60;
const TITULO = 'A Poça Salgada';
const MILHAS = 6;

/** O poço de água aberta: tudo água funda (nada-se), penumbra. */
export const MAPA_POCA = {
  terreno: Array.from({ length: L }, () => 'W'.repeat(L)),
  luz: Array.from({ length: L }, () => '1'.repeat(L)),
  paredes: { n: Array.from({ length: L }, () => '.'.repeat(L)), o: Array.from({ length: L }, () => '.'.repeat(L)) },
  luzes: [],
  interativos: [],
  // A arte é NOSSA (gerada no OpenArt, `src/dev/importar-fundo.py`), então entra no repositório. Sem o arquivo no
  // disco, a cena abre com o ladrilho de água de sempre.
  fundo: { nome: 'poca-salgada.webp', url: '/mapas/poca-salgada.webp', escala: 100, x0: 0, y0: 0, giro: 0, opacidade: 1 },
};
export const PONTOS_POCA = {
  grupo: [{ x: 12, y: 12 }, { x: 13, y: 12 }, { x: 12, y: 13 }, { x: 14, y: 13 }],
  olhar: { dx: 0, dy: 1 },
  estrela: { x: 13, y: 14 },
  longe: { x: 1, y: 1 },
};

/** O teste de uma milha: o melhor entre Atletismo e Furtividade, com vantagem para quem viu a Poça pela ocular. */
export function testeDaMilha(rng, h, vantagem) {
  const um = () => {
    const a = rolarPericia(rng, h, 'atletismo');
    const f = rolarPericia(rng, h, 'furtividade');
    return a.total >= f.total ? { total: a.total, pericia: 'atletismo' } : { total: f.total, pericia: 'furtividade' };
  };
  const r1 = um();
  const r2 = vantagem ? um() : r1;
  const r = r2.total > r1.total ? r2 : r1;
  return { ...r, passou: r.total >= 14 };
}

export function criarPocaSalgada(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o8 = (camp.obelisco8 ??= { feito: {} });
  const t = (o8.poca ??= { milha: 0 });
  const viuPelaOcular = Boolean(camp.obelisco7?.feito?.viuAPiscinaSalobra);
  const estado = { explorando: false, encerrado: false, verme: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && !c.refemDoObelisco);
  const herois = () => todos().filter((c) => c.hp > 0);
  const refens = () => enc.combatants.filter((c) => c.refemDoObelisco && !c.dead);
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });

  function prepararExploracao() {
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) { c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0; c.actionUsed = true; c.bonusUsed = true; c.reactionUsed = true; c.acted = false; }
    estado.explorando = true;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  /** O grupo junto no meio do poço (entre uma milha e outra a correnteza os junta). */
  function juntar() {
    herois().forEach((h, i) => {
      const q = enc.casaLivreMaisProxima(PONTOS_POCA.grupo[i] ?? PONTOS_POCA.grupo[0]);
      if (q) h.pos = { ...h.pos, x: q.x, y: q.y };
    });
    // os reféns no meio do grupo
    for (const r of refens()) { const q = enc.casaLivreMaisProxima(PONTOS_POCA.grupo[0]); if (q) r.pos = { ...r.pos, x: q.x, y: q.y }; }
  }

  /** O VERME, que sai do escuro em cima de quem ele achou. */
  function ataqueDoVerme(alvo) {
    const v = makeMonster('vermePurpura', { x: 0, y: 0 });
    v.speeds = { ...(v.speeds ?? {}), swimFt: 50 };
    v.alvoPreferido = alvo.id;
    v.turnosNaLuta = 0;
    // a casa livre mais perto do alvo onde ele cabe (o verme é imenso: 4x4)
    const q = enc.casaLivreMaisProxima({ x: Math.max(0, alvo.pos.x - 5), y: alvo.pos.y, f: v.pos.f ?? 4 }) ?? { x: 1, y: alvo.pos.y };
    v.pos = { ...v.pos, x: q.x, y: q.y };
    v.side = 'foes';
    enc.addCombatant(v);
    estado.verme = v;
    estado.explorando = false;
    root.classList.remove('explorando');
    app.selected = null;
    // ele vem do escuro: o lado dele começa
    enc.firstSide = 'foes';
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /** O verme vai embora: sem ninguém dentro, some; com alguém dentro, se afasta com a pessoa e fica longe. */
  function vermeVaiEmbora() {
    const v = estado.verme;
    if (!v || v.dead || v.indoEmbora) return;
    const dentro = engolidosDe(enc, v);
    if (!dentro.length) {
      const i = enc.combatants.indexOf(v);
      if (i >= 0) enc.combatants.splice(i, 1);
      enc.say('acao', 'O verme dá a volta e some no escuro do líquido, tão de repente quanto veio.');
      estado.verme = null;
      enc.checkEnd();
      app.refresh();
      return;
    }
    v.indoEmbora = true;
    const q = enc.casaLivreMaisProxima({ ...PONTOS_POCA.longe, f: v.pos.f ?? 4 }) ?? PONTOS_POCA.longe;
    v.pos = { ...v.pos, x: q.x, y: q.y };
    for (const d of dentro) d.pos = { ...d.pos, x: q.x, y: q.y };
    v.casasPermitidas = new Set([`${q.x},${q.y}`]);
    addCondition(v, 'vermeEmFuga', { rounds: Infinity, source: 'poca' });
    enc.say('acao', `O verme dá a volta e nada para longe, com ${dentro.map((d) => d.name).join(' e ')} lá dentro.`);
    app.refresh();
  }

  async function descer() {
    while (t.milha < MILHAS) {
      t.milha += 1;
      juntar();
      const linhas = [`Milha ${t.milha} de ${MILHAS}.`];
      const falhou = [];
      for (const h of herois()) {
        const r = testeDaMilha(enc.rng, h, viuPelaOcular);
        linhas.push(`${h.name} (${SKILL_NAME[r.pericia]} ${r.total}${viuPelaOcular ? ', com vantagem' : ''}) ${r.passou ? 'desce sem chamar atenção' : 'esbarra num grumo de carne enorme, que sai rolando pelo líquido'}.`);
        if (!r.passou) falhou.push(h);
      }
      if (falhou.length) {
        linhas.push('Alguma coisa enorme muda de rumo, lá embaixo no escuro.');
        await painel(linhas, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        ataqueDoVerme(falhou[0]);
        return;
      }
      await painel(linhas);
    }
    return chegarAoFundo();
  }

  async function chegarAoFundo() {
    juntar();
    if (!t.fundo) {
      t.fundo = true;
      await painel(['O fundo da poça é coberto de pelos grossos que ondulam como alga. No meio deles, um ponto de escuridão do tamanho de uma cabeça de alfinete brilha prateado: uma estrela sem luz.',
        'Quem olha de perto sabe, sem que ninguém diga, que é por ali.']);
      const sobem = darMarco(todos(), 11);
      enc.say('cura', 'Marco: o grupo chega ao 11º nível.');
      if (sobem.length && root) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
    }
    prepararExploracao();
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    Refens.guardarRefens(enc, camp);
    fazer(todos());
  }

  /**
   * A SUBIDA COM OS REFÉNS: as mesmas seis milhas, de volta, e o mesmo teste de cada um por milha — os reféns também
   * rolam (Atletismo ou Furtividade CD 14), e quem falha chama o verme, que vem atrás dele. Sem reféns, ou com o verme
   * morto, sobe-se como antes, de uma vez (o livro só pede a escolta pela Poça porque há o verme nela).
   */
  async function subir() {
    const ir = () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'labirintoSalgado', chegada: 'poca', continuarCom: v }));
    if (!refens().length || t.vermeMorto) { t.subindo = false; return ir(); }
    t.subindo = true;
    t.milhaSubida ??= 0;
    while (t.milhaSubida < MILHAS) {
      t.milhaSubida += 1;
      juntar();
      const linhas = [`Subindo: milha ${t.milhaSubida} de ${MILHAS}, com ${refens().length > 1 ? `${refens().length} reféns` : 'um refém'} no meio do grupo.`];
      const falhou = [];
      for (const h of [...herois(), ...refens()]) {
        const r = testeDaMilha(enc.rng, h, viuPelaOcular && !h.refemDoObelisco);
        linhas.push(`${h.name} (${SKILL_NAME[r.pericia]} ${r.total}) ${r.passou ? 'sobe sem chamar atenção' : 'se debate e esbarra num grumo de carne'}.`);
        if (!r.passou) falhou.push(h);
      }
      if (falhou.length) {
        linhas.push('Lá embaixo, alguma coisa enorme muda de rumo e sobe atrás de vocês.');
        await painel(linhas, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        ataqueDoVerme(falhou[0]);
        return;
      }
      await painel(linhas);
    }
    t.subindo = false;
    t.milhaSubida = 0;
    return ir();
  }

  return {
    lugar: TITULO,
    portasProprias: true,
    investigavel: false,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    estado,
    descer,
    interacoes(tile, sup, c) {
      if (!c || !estado.explorando || !t.fundo) return [];
      const ops = [];
      if (distanceFt(tile, PONTOS_POCA.estrela) <= 5) {
        ops.push({ rotulo: 'Tocar a estrela sem luz', icone: 'acao-disparada', detalhe: 'o Vazio Sem Fim', motivo: longe(c, tile),
          fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'vazioCupula', continuarCom: v })) });
      }
      ops.push({ rotulo: 'Subir de volta ao labirinto', icone: 'acao-disparada', detalhe: refens().length && !t.vermeMorto ? 'seis milhas, com os reféns' : 'seis milhas', fazer: () => subir() });
      return ops;
    },
    depoisDeMover(c) { if (c && estado.explorando) { c.movementLeftFt = MOVIMENTO; Refens.seguirOGrupo(enc, c); } return false; },
    subir,
    evento(ev) {
      Refens.eventoDosRefens(enc, camp, ev);
      const v = estado.verme;
      if (!v) return;
      // o verme conta os turnos dele; no fim do segundo, vai embora
      if (ev.type === 'turnEnd' && ev.actor === v && !v.indoEmbora) {
        v.turnosNaLuta += 1;
        if (v.turnosNaLuta >= 2) vermeVaiEmbora();
        return;
      }
      // longe e sem ninguém dentro (vomitou, ou quem estava dentro morreu): some de vez
      if (v.indoEmbora && !v.dead && !engolidosDe(enc, v).length) {
        v.indoEmbora = false;
        vermeVaiEmbora();
      }
    },
    async fimDoCombate(outcome) {
      if (outcome !== 'vitoria') {
        estado.encerrado = true;
        await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['O líquido se fecha sobre vocês. Lá no fundo, a estrela sem luz continua brilhando para ninguém.'] }] });
        app.encerrarPartida();
        return;
      }
      const v = estado.verme;
      if (v?.dead) {
        // morto aqui, ele não sobe para a luta da Refração (`labirinto-salgado.js chegaARefracao`)
        t.vermeMorto = true;
        const cada = Math.floor((v.xp ?? 0) / Math.max(1, todos().length));
        const sobem = darXp(todos(), cada);
        enc.say('cura', `O verme púrpura morre: ${cada} XP para cada um.`);
        if (sobem.length && root) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
      }
      estado.verme = null;
      return t.subindo ? subir() : descer();
    },
    async iniciar() {
      tirarVooDoVazio(todos());
      Refens.montarRefens(enc, camp, herois());
      // descer a Poça depois da Refração leva horas: o portal de Illithinoch fecha (`labirinto-salgado.js relogioDoPortal`)
      const lab = camp.obelisco8?.lab;
      if (lab?.feito?.refracaoVencida && !lab.feito.portalFechado && lab.portalMinutos != null) { lab.portalMinutos += 120; lab.feito.portalFechado = true; }
      for (const h of herois()) { const q = enc.casaLivreMaisProxima(PONTOS_POCA.grupo[herois().indexOf(h)] ?? PONTOS_POCA.grupo[0]); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
      if (t.fundo) return chegarAoFundo();
      if (!t.milha) {
        await painel(['O líquido aperta de todos os lados, morno e grosso, e entra nos pulmões sem afogar ninguém. Tocá-lo é encostar numa coisa enorme que pensa, longe e devagar.',
          'Nuvens de sangue e grumos de carne flutuam por toda parte. Não fazem mal. Mas atrás deles alguma coisa grande se mexe, e tem fome.',
          viuPelaOcular ? 'Vocês já viram esta poça pelos olhos de outro: sabem onde ela engrossa e onde os grumos se juntam.' : 'São seis milhas até o fundo.']);
      }
      return descer();
    },
  };
}
