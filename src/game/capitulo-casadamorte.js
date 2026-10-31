// Livro do Jogador não é SRD: a Maldição de Strahd é conteúdo da Wizards. TEXTO nosso, fatos do livro — ver NOTICE.md e STRAHD.md.
//
// A CASA DA MORTE, 1º ANDAR (Apêndice B, áreas 1 a 5). Exploração livre, sem iniciativa: não há monstro neste andar. A casa é "viva": o
// térreo parece novo, e é a escadaria de mármore vermelho que leva ao resto (segundo andar ainda a fazer). O que a cena faz:
//   - ao entrar numa sala pela primeira vez, a descrição dela;
//   - os painéis (Percepção CD 12) do salão e da sala de jantar, onde há cobras, crânios e rostos escondidos na madeira;
//   - o armário trancado do canil (Destreza CD 15, ferramentas de ladrão): três bestas e sessenta virotes.
//
// Mesma interface de cena dos outros capítulos (`main.js`): lugar, explorando, encerrado, interacoes, depoisDeMover, fimDoCombate, evento,
// iniciar.

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { ctxDe } from './magias-fora.js';
import { rolarTeste } from '../rules/utilidade.js';
import { guardar } from './comercio.js';
import { garantirInventario } from '../rules/equipment.js';
import { AREAS_TERREO } from './casadamorte.js';

const MOVIMENTO = 60;
const dentro = (a, p) => p.x >= a.x1 && p.x <= a.x2 && p.y >= a.y1 && p.y <= a.y2;

export function criarCasaDaMorte(app, config) {
  const enc = app.enc;
  const root = app.root;
  const campanha = (app.campanha ??= {});
  const salvo = ((campanha.strahd ??= {}).terreo ??= { vistas: [], paineisSala: false, paineisSalao: false, armarioAberto: false });
  const estado = { explorando: false, encerrado: false };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const teste = (c, pericia, cd) => {
    const x = ctxDe(app, enc);
    const r = rolarTeste(x.estado, x.herois(), enc.rng, c, pericia, cd, {});
    return { quem: r.quem, total: r.total, cd, passou: r.passou };
  };
  const areaDe = (p) => AREAS_TERREO.find((a) => dentro(a, p));
  const longe = (c, tile, pes = 10) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);

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
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  async function descrever(area) {
    if (salvo.vistas.includes(area.id)) return;
    salvo.vistas.push(area.id);
    await painel(area.texto, { titulo: `${area.area}. ${area.nome}` });
  }

  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    const a = areaDe(c.pos);
    if (a) await descrever(a);
  }

  /** O que o menu do botão direito oferece na casa clicada. */
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const area = areaDe(tile);
    const ops = [];
    if (!area) return ops;
    if ((area.id === 'salao' || area.id === 'jantar') && sup !== 'parede') {
      const feito = area.id === 'salao' ? salvo.paineisSalao : salvo.paineisSala;
      ops.push({
        rotulo: 'Examinar os painéis da parede', icone: 'acao-procurar', detalhe: feito ? 'já examinados' : 'Percepção, CD 12',
        motivo: feito ? 'já examinados' : null,
        fazer: async () => {
          const t = teste(c, 'percepcao', 12);
          if (area.id === 'salao') salvo.paineisSalao = true; else salvo.paineisSala = true;
          await painel(t.passou
            ? (area.id === 'salao'
              ? `${t.quem?.name ?? c.name} se aproxima da madeira entalhada e vê o que o enfeite esconde: serpentes e crânios, tecidos com discrição entre as videiras e as flores.`
              : `${t.quem?.name ?? c.name} segue as árvores esculpidas e acha o que elas escondem: rostos retorcidos nos troncos e lobos à espreita entre as folhas.`)
            : `${c.name} passa a mão pela madeira lustrada. Bonita, nada mais.`);
        },
      });
    }
    if (area.id === 'canil' && sup !== 'parede') {
      ops.push({
        rotulo: salvo.armarioAberto ? 'O armário do leste (aberto)' : 'Abrir o cadeado do armário do leste',
        icone: 'acao-usarObjeto', detalhe: salvo.armarioAberto ? 'já aberto' : 'ferramentas de ladrão, Destreza CD 15',
        motivo: salvo.armarioAberto ? 'já aberto' : longe(c, { x: 12, y: 21 }, 40),
        fazer: async () => {
          const ladrao = herois().find((h) => garantirInventario(h).bag.some((i) => i.id === 'ferramentasDeLadrao'));
          if (!ladrao) { await painel('O cadeado é pequeno e firme. Sem ferramentas de ladrão, não há o que fazer.'); return; }
          const t = teste(ladrao, 'prestidigitacao', 15);
          if (!t.passou) { await painel(`${ladrao.name} mexe no cadeado até a ponta da gazua entortar. Dá para tentar de novo com mais calma.`); return; }
          salvo.armarioAberto = true;
          const quem = herois()[0];
          for (const arma of ['bestaPesada', 'bestaLeve', 'bestaDeMao']) if (!(quem.weapons ?? []).includes(arma)) (quem.weapons ??= []).push(arma);
          guardar(quem, 'virotes', 60);
          await painel(`O cadeado cede. Dentro, três bestas (pesada, leve e de mão) e sessenta virotes, tudo limpo e oleado. ${quem.name} fica com o lote.`);
          app.refresh();
        },
      });
    }
    if (sup === 'escada') {
      ops.push({
        rotulo: 'Subir a escadaria de mármore', icone: 'acao-usarObjeto', detalhe: 'segundo andar', motivo: null,
        fazer: async () => { await painel('A escadaria gira para cima, ladeada por painéis de madeira entalhada, e uma corrente de ar frio desce por ela. (O segundo andar ainda está em obras: a casa continua aqui quando ele ficar pronto.)'); },
      });
    }
    return ops;
  }

  return {
    lugar: 'Casa da Morte',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    interacoesDoHeroi: (c) => interacoes(c.pos, enc.field.surfaceAt(c.pos.x, c.pos.y), c),
    depoisDeMover,
    fimDoCombate() {},
    evento() {},
    dialogoDe: () => null,
    depoisDaConversa: () => {},
    motivoSemDescanso: () => 'Ninguém fecha os olhos numa casa que não para de olhar de volta.',
    textoDoDescanso: () => ['Uma hora de vigia revezada num canto da sala de espera.'],
    async iniciar() {
      prepararExploracao();
      const a = areaDe(herois()[0]?.pos ?? { x: 2, y: 21 });
      if (a) await descrever(a);
    },
  };
}
