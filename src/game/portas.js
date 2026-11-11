// AS PORTAS, em qualquer mapa: abrir, fechar e, na trancada, abrir a fechadura, arrombar ou usar a chave.
//
// Cada capítulo grande já escrevia o seu "Abrir a porta" (o castelo, a Árvore Trovão, a Onda Eco, a Mansão), e o mapa
// feito no editor não tinha nenhum: a porta desenhada ficava fechada para sempre. Aqui está o caso geral. Ele só
// entra quando a cena não oferece a porta ela mesma (`interacoes.js` confere), então não briga com o roteiro.
//
// A TRANCA é dado do mapa (`mapa.trancas`: `{ aresta: 'x,y,N|O', cd, chave?, forca? }`, desenhada no editor): a porta
// fechada (`+`) com uma CD. As três saídas, como no livro:
//   abrir a fechadura   Destreza (Prestidigitação) com ferramentas de ladrão, contra a CD
//   arrombar            Força (Atletismo), contra `forca` (o padrão é CD + 5: forçar é mais difícil que destrancar)
//   a chave             quem carrega o item `chave` abre sem teste
// Na luta, mexer na fechadura e arrombar gastam a ação; abrir e fechar uma porta destrancada é a interação grátis.

import { ARESTA, distanceFt } from '../core/grid.js';
import { rolarTeste } from '../rules/utilidade.js';
import { garantirInventario } from '../rules/equipment.js';
import { ctxDe } from './magias-fora.js';
import { audio } from '../core/audio.js';

const VIZINHAS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A chave da aresta entre duas casas vizinhas no eixo: 'x,y,N' (o norte da casa de baixo) ou 'x,y,O' (o oeste da da direita). */
export function chaveDaAresta(a, b) {
  if (a.x === b.x) return `${a.x},${Math.max(a.y, b.y)},N`;
  return `${Math.max(a.x, b.x)},${a.y},O`;
}

/** As portas (fechadas ou abertas) nas quatro arestas da casa. */
export function portasDaCasa(field, tile) {
  const out = [];
  for (const [dx, dy] of VIZINHAS) {
    const b = { x: tile.x + dx, y: tile.y + dy };
    if (!field.inside(b.x, b.y)) continue;
    const cod = field.aresta(tile.x, tile.y, b.x, b.y);
    if (cod !== ARESTA.porta && cod !== ARESTA.aberta) continue;
    const chave = chaveDaAresta(tile, b);
    out.push({ a: { ...tile }, b, cod, chave, tranca: field.trancas?.get(chave) ?? null });
  }
  return out;
}

const tem = (c, id) => garantirInventario(c).bag.some((i) => i.id === id && (i.qtd ?? 1) > 0);

/** As opções do menu do botão direito para as portas da casa `tile`, para o herói `c`. */
export function opcoesDePorta(app, c, tile, { fora = true } = {}) {
  const enc = app.enc;
  if (!enc || !c) return [];
  const ops = [];
  for (const p of portasDaCasa(enc.field, tile)) {
    const longe = Math.min(distanceFt(c.pos, p.a), distanceFt(c.pos, p.b)) > 5 ? 'longe demais — encoste na porta' : null;
    const semAcao = !fora && c.actionUsed ? 'sem ação neste turno' : null;
    // Toda porta que abre range, venha do menu ou do roteiro. O som é da MADEIRA; a laje de pedra da Mansão tem o `doorStone` dela.
    const abrir = (texto, som = 'doorWood') => {
      enc.field.porAresta(p.a.x, p.a.y, p.b.x, p.b.y, ARESTA.aberta);
      if (som) audio.play(som);
      enc.say('acao', texto);
      app.refresh?.();
    };
    const destrancar = () => enc.field.trancas?.delete(p.chave);
    if (p.cod === ARESTA.aberta) {
      const naPassagem = enc.combatants.some((o) => !o.dead && o.pos && [p.a, p.b].some((q) => o.pos.x === q.x && o.pos.y === q.y) && o !== c);
      ops.push({
        rotulo: 'Fechar a porta', icone: 'acao-empurrar', detalhe: 'corta a visão',
        motivo: longe ?? (naPassagem ? 'tem alguém na passagem' : null),
        fazer: () => {
          enc.field.porAresta(p.a.x, p.a.y, p.b.x, p.b.y, ARESTA.porta);
          audio.play('doorShut');
          enc.say('acao', `${c.name} fecha a porta.`);
          app.refresh?.();
        },
      });
      continue;
    }
    if (!p.tranca) {
      ops.push({ rotulo: 'Abrir a porta', icone: 'acao-usarObjeto', detalhe: 'de graça', motivo: longe, fazer: () => abrir(`${c.name} abre a porta.`) });
      continue;
    }
    // trancada
    const cd = p.tranca.cd ?? 15;
    const forca = p.tranca.forca ?? cd + 5;
    const teste = (pericia, alvo) => {
      const x = ctxDe(app, enc);
      return rolarTeste(x.estado, x.herois(), enc.rng, c, pericia, alvo);
    };
    const gasta = () => { if (!fora) c.actionUsed = true; };
    if (tem(c, p.tranca.chave ?? 'chave')) {
      ops.push({
        rotulo: 'Destrancar com a chave', icone: 'acao-usarObjeto', detalhe: 'sem teste', motivo: longe,
        fazer: () => { destrancar(); audio.play('lockKey'); abrir(`${c.name} gira a chave e abre a porta.`); },
      });
    }
    ops.push({
      rotulo: 'Abrir a fechadura', icone: 'acao-usarObjeto', detalhe: `ferramentas de ladrão · Destreza, CD ${cd}`,
      motivo: longe ?? semAcao ?? (tem(c, 'ferramentasDeLadrao') ? null : `${c.name} não tem ferramentas de ladrão`),
      fazer: () => {
        gasta();
        const t = teste('prestidigitacao', cd);
        if (t.passou) { destrancar(); audio.play('lockPick'); abrir(`${c.name} mexe na fechadura até ela ceder (${t.total} contra CD ${cd}) e abre a porta.`); return; }
        audio.play('lockFail');
        enc.say('acao', `A fechadura resiste a ${c.name} (${t.total} contra CD ${cd}).`);
        app.refresh?.();
      },
    });
    ops.push({
      rotulo: 'Arrombar a porta', icone: 'acao-empurrar', detalhe: `Força, CD ${forca} · faz barulho`, motivo: longe ?? semAcao,
      fazer: () => {
        gasta();
        const t = teste('atletismo', forca);
        if (t.passou) { destrancar(); audio.play('doorBash'); abrir(`${c.name} mete o ombro e a porta cede com estrondo (${t.total} contra CD ${forca}).`, null); return; }
        audio.play('doorHold');
        enc.say('acao', `A porta aguenta o tranco de ${c.name} (${t.total} contra CD ${forca}).`);
        app.refresh?.();
      },
    });
  }
  return ops;
}
