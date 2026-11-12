// O CAPÍTULO 7 DO OBELISCO NA VILA ("Fendas na Realidade"): a briga no Santuário da Sorte, sobre o mesmo battlemap da
// FA do largo do capítulo 6 ("Phandalin Alleys", `game/obelisco6-mapas.js`), que é o mapa que o livro usa para ela.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - três moradores que passaram tempo demais perto dos cacos do obelisco viram MORADORES INFECTADOS (o berserker com a
//     Pancada Psíquica): a Irmã Garaele, a Halia Thornton e o Ander, o rapaz do armazém dos Barthen;
//   - a multidão se afasta e pede que o grupo os DOMINE SEM MATAR: o livro os quer vivos, presos até haver cura (a cura é
//     derrotar os fanáticos). O golpe não letal do corpo a corpo já existe (`combat.js`, `naoLetal`); aqui a cena oferece
//     ligá-lo para o grupo inteiro antes da luta. Magia e tiro de longe matam, como em qualquer outra luta;
//   - vencida a briga, a Gwyn Oresong e a Greska chegam e pedem ao grupo que vá ver o Wheel-of-Fortune, no Gigante
//     Adormecido (`obelisco5-terreo.js`, no modo do capítulo 7).
//
// O estado mora em `app.campanha.obelisco7`.

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition } from '../rules/conditions.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { deNoite } from './relogio.js';
import { definirEscuridao } from '../rules/luz.js';
import { PONTOS_CAP7_VILA, MORADORES } from './obelisco7-mapas.js';

const MOVIMENTO = 60;

const TITULO = 'O Santuário da Sorte';

export function criarLugarDoCap7(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o7 = (camp.obelisco7 ??= { feito: {}, lutas: {} });
  o7.feito ??= {};
  o7.lutas ??= {};
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: false };
  const P = PONTOS_CAP7_VILA.SANTUARIO_INFECTADO;
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: TITULO, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };

  // ------------------------------------------------------------- o elenco ----
  const moradores = o7.lutas.santuario ? [] : MORADORES.map((m, i) => {
    const f = makeMonster('moradorInfectado', { ...P.moradores[i] });
    f.name = m.nome;
    f.morador = m.id;
    // gente da vila: a IA bate em quem está perto, mas eles não são bando de ninguém
    f.facingVec = { dx: -1, dy: 0 };
    return f;
  });

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    for (const c of enc.combatants) {
      c.movementLeftFt = c.side === 'party' ? MOVIMENTO : 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      c.reactionUsed = true;
      c.acted = false;
    }
    estado.explorando = true;
    estado.lutando = false;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(todos());
  }

  /** Quem caiu VIVO (o golpe não letal deixa `capturado`) e quem morreu. */
  const vivosDosTres = () => moradores.filter((f) => !f.dead && (f.capturado || hasCondition(f, 'inconsciente') || f.hp > 0));
  const mortosDosTres = () => moradores.filter((f) => f.dead);

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: TITULO, texto: ['A vila acorda no dia seguinte com mais três corpos para enterrar, e nenhum herói para contar o que houve.'] }] });
      app.encerrarPartida();
      return;
    }
    o7.lutas.santuario = true;
    for (const h of todos()) h.naoLetal = false;
    const vivos = vivosDosTres();
    const mortos = mortosDosTres();
    o7.presos = vivos.map((f) => f.morador);
    o7.mortos = mortos.map((f) => f.morador);
    const nomes = (l) => l.map((f) => f.name).join(', ').replace(/, ([^,]*)$/, ' e $1');
    const texto = [];
    if (!mortos.length) {
      texto.push(`${nomes(vivos)} estão no chão, respirando. A multidão volta devagar, e alguém traz corda. Ninguém sabe o que fazer com eles além de amarrar e esperar.`);
    } else if (!vivos.length) {
      texto.push(`${nomes(mortos)} não se levantam mais. A multidão que pediu para vocês os pouparem fica em silêncio, e depois se dispersa sem olhar para trás.`);
    } else {
      texto.push(`${nomes(vivos)} ${vivos.length > 1 ? 'estão' : 'está'} no chão, vivo${vivos.length > 1 ? 's' : ''}. ${nomes(mortos)} não ${mortos.length > 1 ? 'se levantam' : 'se levanta'} mais. Alguém traz corda; ninguém fala.`);
    }
    if (vivos.length) texto.push('O Harbin Wester manda levá-los para as celas do salão, "até alguém saber o que fazer". De vez em quando, um deles ri sozinho.');
    await painel(texto);
    await painel([
      'Uma anã de óculos e uma orc de avental abrem caminho pela multidão: a Gwyn Oresong e a Greska, do Gigante Adormecido.',
      '— Eles passaram dias perto dos cacos do obelisco — diz a Gwyn, olhando os três. — A Garaele no santuário, a Halia no prédio dela, o Ander no poço do armazém. A pedra ficou neles.',
      '— Tem mais um — resmunga a Greska. — O meu atendente. Trabalhava do lado da pedra, no balcão. Está trancado no salão, no escuro, e não deixa ninguém acender a luz. Venham ver.',
    ]);
    o7.feito.gwynChamou = true;
    vila.missoes ??= {};
    if (!vila.missoes.wheel) vila.missoes.wheel = 'ativa';
    pista('Garaele, Halia e Ander passaram dias perto dos cacos do obelisco e enlouqueceram. O Wheel-of-Fortune, que trabalhava junto da pedra no balcão do Gigante Adormecido, está mudando também.');
    // o XP do livro: o encontro vale o mesmo, mortos ou dominados
    const grupo = todos();
    const xp = moradores.filter((f) => f.dead || f.capturado || f.hp <= 0).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (grupo.length && xp) {
      const cada = Math.floor(xp / grupo.length);
      const sobem = darXp(grupo, cada);
      enc.say('cura', `Os moradores infectados: ${cada} XP para cada um.`);
      if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
    }
    await painel('O largo está quieto. Olhem em volta à vontade (botão direito no que a arte desenha); pela borda do mapa, volta-se ao centro da vila.');
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    if (o7.lutas.santuario && (tile.x === 0 || tile.y === 0 || tile.y === 19 || tile.x === 14)) {
      ops.push({ rotulo: 'Voltar ao centro da vila', icone: 'acao-disparada',
        motivo: distanceFt(c.pos, tile) > 5 ? 'longe demais — chegue a 5 pés' : null, fazer: () => sair((v) => app.irParaVila(v)) });
    }
    return ops;
  }

  return {
    lugar: TITULO,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) { if (c && estado.explorando) c.movementLeftFt = MOVIMENTO; },
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    moradores,
    async iniciar() {
      if (deNoite(vila.tempo ?? 0)) definirEscuridao(enc.field, 0.8);
      if (o7.lutas.santuario) { prepararExploracao(); return; }
      const r = await painel([
        'Gritos no largo do Santuário da Sorte. A multidão abre uma roda, e no meio dela três pessoas que vocês conhecem: a Irmã Garaele, a Halia Thornton e o Ander, o rapaz do armazém dos Barthen.',
        'Os três têm os olhos vidrados e a boca suja de sangue, e batem em quem chega perto com a força de quem não sente mais nada. A Halia acabou de jogar um homem por cima de uma carroça.',
        '— Não matem! — grita uma mulher da roda. — Pelos deuses, são gente nossa! Não matem!',
      ], [
        { rotulo: 'Bater para derrubar (golpes não letais)', valor: 'poupar', primaria: true },
        { rotulo: 'Lutar como for preciso', valor: 'lutar' },
      ]);
      if (r === 'poupar') {
        for (const h of herois()) h.naoLetal = true;
        enc.say('acao', 'O grupo bate para derrubar: quem cair pelo corpo a corpo fica desacordado, vivo. Magia e tiro de longe ainda matam.');
      }
      for (const f of moradores) enc.addCombatant(f);
      estado.lutando = true;
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}
