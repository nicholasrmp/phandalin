// O SANTUÁRIO ÍNDIGO (o fim do capítulo 5 do Obelisco). Mapa em `game/zorzula-mapas.js`, da planta da FA.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - obsidiana, teto de 6 m, duas cascatas de lava ladeando a entrada; ao fundo, a estátua rachada de uma anã sorrindo
//     e, atrás dela, o mezanino;
//   - o RUXITHID, no mezanino, já sabe que o grupo vem. Fala calmo e cordial, como arauto de uma metamorfose do mundo;
//     Intuição CD 16 vê os olhos dele revirando: ele conversa com outra mente ao mesmo tempo. Fica hostil se o grupo não
//     der sinal de se juntar a ele, ou se alguém ameaçar;
//   - a luta: ele e a estátua, que é um GUARDIÃO-ESCUDO sob o comando dele pelo cristal (morto ele, ela para:
//     `combat.js guardiaoSemMestre`). Ele luta até morrer;
//   - morto ele, o cristal se parte e três vozes dão a última ordem: buscar as três lascas que faltam — em
//     Talhundereth, na Cripta dos Talhund e na Travessia da Forca. Religião CD 13: aquilo não é deus nenhum;
//   - a ALA OESTE, os reféns: Dareth Grint, Paulina Previne e Tumblewick Rollins, plebeus fracos e quase sem sentidos;
//   - a ALA LESTE, a sala de guerra: o mapa com os três nomes e, com Investigação CD 15, o esboço da coluna partida;
//   - quem foi SUBJUGADO no refeitório acorda aqui, na ala oeste, junto dos reféns (`config.comoPresos`).
//
//   - a estátua GUARDA um Assassino Fantasmagórico do criador duergar, e o Ruxithid manda soltá-lo (uma vez:
//     `magiaGuardada`, `ai.js magiaGuardadaNoTurno`);
//   - se a luta estiver fácil, dois goblins psíquicos lutadores sobem do posto e entram depois de três rodadas; morto o
//     Ruxithid, eles se rendem (`rendeSemMestre`, `combat.js guardiaoSemMestre`).
//
// DECISÕES NOSSAS, ditas:
//   - o livro não diz o que o Ruxithid quer de quem aceita: aqui, aceitar não é opção — ele pede uma prova que nenhum
//     herói dá (entregar os reféns às vozes), e a conversa termina na luta;
//   - o livro não dá a CD do criador duergar: o Assassino Fantasmagórico da estátua sai com a CD 15 do próprio Ruxithid;
//   - "fácil", para os dois goblins da quarta rodada, é medido: ninguém do grupo no chão e o grupo com pelo menos
//     metade da vida somada;
//   - a plataforma desce às minas, que são tabuleiro; levar os REFÉNS para fora é narrado (eles mal andam, e ninguém os
//     faz atravessar as minas de casa em casa).
//
// O MARCO do 7º nível sai aqui, com o Ruxithid morto (o capítulo 5 vai do 5º ao 7º).

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { rolarPericia, SKILL_NAME, skillBonus } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition } from '../rules/conditions.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { darMarco } from './obelisco5-vila.js';
import { PONTOS_ZORZULA } from './zorzula-mapas.js';

const P = PONTOS_ZORZULA.ZORZULA_SANTUARIO;
const MOVIMENTO = 60;
const SALA_DE = new Map();
for (const [id, cs] of Object.entries(P.salas)) for (const c of cs) SALA_DE.set(`${c.x},${c.y}`, id);
export const salaDoSantuario = (p) => (p ? SALA_DE.get(`${p.x},${p.y}`) ?? null : null);

export const REFENS = [
  { nome: 'Dareth Grint', fala: '— Sou primo do Harbin… de segundo grau. Ele vai pagar, não vai? — Ele ri e tosse ao mesmo tempo.' },
  { nome: 'Paulina Previne', fala: '— Eles queriam montar uma coluna de pedra. Uma coluna grande, quebrada. Falavam disso o dia inteiro.' },
  { nome: 'Tumblewick Rollins', fala: '— Tinha mais gente presa. Levaram para um "propósito especial", e não voltaram. E o chefe usava a sala do outro lado para fazer planos.' },
];

export function criarZorzulaSantuario(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o5 = (camp.obelisco5 ??= { iniciado: true, cenas: {}, pistas: [], feito: {} });
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const z = (o5.zorzula ??= {});
  const estado = { explorando: false, encerrado: false, lutando: false };
  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: 'O Santuário Índigo', texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const teste = (c, pericia, cd) => {
    const r = rolarPericia(enc.rng, c, pericia);
    return { nome: SKILL_NAME[pericia], total: r.total, passou: r.total >= cd };
  };
  const melhor = (pericia) => herois().reduce((a, h) => (!a || skillBonus(h, pericia) > skillBonus(a, pericia) ? h : a), null);
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);

  // ------------------------------------------------------------- o elenco ----
  const vencido = z.santuario === 'vencido';
  const ruxithid = vencido ? null : makeMonster('ruxithid', { ...P.ruxithid });
  if (ruxithid) ruxithid.name = 'Ruxithid, o Escolhido';
  const guardiao = vencido ? null : makeMonster('guardiaoEscudo', { ...P.guardiao, f: 2 });
  if (guardiao) {
    guardiao.name = 'A estátua (guardião-escudo)';
    guardiao.comandadoPor = ruxithid.id;
    // a magia que o criador duergar guardou nela (o livro), com a CD do Ruxithid, que manda soltá-la
    guardiao.magiaGuardada = 'assassinoFantasmagorico';
    guardiao.spellcasting = { ability: 'int', cantrips: [], prepared: ['assassinoFantasmagorico'], slots: [0, 0, 0, 0, 1], cdPorMagia: { assassinoFantasmagorico: 15 } };
  }
  const reforco = [];
  const refens = z.refensSalvos ? [] : REFENS.map((r, i) => {
    const m = makeMonster('plebeu', { ...P.refens[i] });
    Object.assign(m, { name: r.nome, refem: true, hp: 1, falas: [r.fala] });
    return m;
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

  function luta() {
    for (const f of [ruxithid, guardiao]) { f.side = 'foes'; if (!enc.combatants.includes(f)) enc.addCombatant(f); }
    // a estátua desce do pedestal: o desenho mostra o pedestal vazio, ainda com a energia verde do cristal que a move
    enc.field.alternarSobreposicao?.('pedestalEnergia', true);
    estado.explorando = false;
    estado.lutando = true;
    z.santuario = 'luta';
    root.classList.remove('explorando');
    enc.emboscada = null;
    // DOIS LUTADORES DO POSTO (o livro): se a luta estiver fácil, sobem e entram depois de três rodadas
    enc.reinforcements = (rodada) => {
      if (rodada !== 4 || z.reforcoDoSantuario) return null;
      if (!lutaFacil()) return null;
      z.reforcoDoSantuario = true;
      const casas = (P.salas.elevador ?? []).filter((c) => !enc.field.blocksMove(c.x, c.y) && !enc.occupied(c.x, c.y));
      for (const [i, c] of casas.slice(0, 2).entries()) {
        const g = makeMonster('goblinPsiLutador', { ...c }, { nameSuffix: 'AB'[i] });
        g.rendeSemMestre = ruxithid.id;
        g.side = 'foes';
        reforco.push(g);
      }
      return reforco.length ? { units: reforco, aviso: 'A plataforma sobe rangendo: dois goblins de cabeça comprida saltam dela, já com as lâminas da mente acesas.' } : null;
    };
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  /** A luta está fácil? Ninguém do grupo no chão, e o grupo com pelo menos metade da vida somada. */
  function lutaFacil() {
    const h = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    if (!h.length || h.some((c) => c.hp <= 0)) return false;
    const vida = h.reduce((s, c) => s + c.hp, 0);
    const max = h.reduce((s, c) => s + c.maxHp, 0);
    return vida >= max / 2;
  }

  // ---------------------------------------------------------- a conversa ----
  async function conversa() {
    if (z.santuario || !ruxithid) return false;
    z.santuario = 'conversa';
    const linhas = [
      'Do mezanino, atrás da estátua rachada, um goblin de cabeça enorme olha para baixo. Do crânio dele sai um cristal azul que pulsa devagar. Ele não parece surpreso.',
      '— Bem-vindos. Eu esperava vocês. — A voz é mansa, quase cantada. — Sou só um arauto. O mundo vai mudar de pele, como uma cobra, e os deuses me escolheram para anunciar. Vocês podem estar do lado certo da muda.',
    ];
    let viu = false;
    for (;;) {
      const r = await painel(linhas.splice(0), [
        ...(!viu ? [{ rotulo: 'Observar os olhos dele (Intuição, CD 16)', valor: 'intuicao' }] : []),
        { rotulo: 'Perguntar o que ele quer', valor: 'ouvir', primaria: true },
        { rotulo: 'Atacar', valor: 'luta' },
      ]);
      if (r === 'intuicao') {
        viu = true;
        const quem = melhor('intuicao');
        const t = teste(quem, 'intuicao', 16);
        linhas.push(t.passou
          ? `${quem.name} (${t.nome} ${t.total}) vê: enquanto ele fala, os olhos dele reviram, de leve, de tempos em tempos — como os de quem escuta outra pessoa ao mesmo tempo. Ele não está sozinho na própria cabeça.`
          : `${quem.name} (${t.nome} ${t.total}) não vê nada além de um goblin muito calmo.`);
        continue;
      }
      if (r === 'ouvir') {
        await painel(['— Juntem-se a nós. As vozes têm lugar para gente forte. — Ele inclina a cabeça, escutando alguma coisa. — Mas querem uma prova. Os três da ala oeste. Entreguem os três às vozes, e a muda será gentil com vocês.',
          'Ninguém responde. O cristal pulsa mais rápido, e a estátua, lá embaixo, vira a cabeça de pedra na direção de vocês.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      }
      luta();
      return true;
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Santuário Índigo', texto: ['O cristal pulsa, satisfeito. Em Phandalin, ninguém nunca soube o que houve com quem foi buscar os desaparecidos.'] }] });
      app.encerrarPartida();
      return;
    }
    z.santuario = 'vencido';
    // o cristal apaga: o pedestal perde a energia, e a plataforma também (ela continua a subir e descer, mas apagada)
    enc.field.alternarSobreposicao?.('pedestalEnergia', false);
    enc.field.alternarSobreposicao?.('pocoEnergia', false);
    enc.field.alternarSobreposicao?.('pedestalVazio', true);
    const linhas = [
      'O Ruxithid cai, e o cristal da cabeça dele racha com um som de sino. Por um instante, o salão inteiro canta: um coro sem boca, de dentro da pedra.',
      'Três vozes falam juntas, e falam em vocês: "Achem as três que faltam. Em Talhundereth. Na Cripta dos Talhund. Na Travessia da Forca. E Phandalin será nossa."',
      'O cristal apaga e vira pedra cinza. A estátua para no meio de um passo, com um braço erguido, e não se mexe mais.',
    ];
    const quem = melhor('religiao');
    const t = quem ? teste(quem, 'religiao', 13) : { passou: false };
    if (t.passou) {
      linhas.push(`${quem.name} (${t.nome} ${t.total}) tem certeza: aquilo não era deus nenhum. Nenhum culto, nenhum rito, nenhum nome. Coisas que falam DE DENTRO, fingindo ser deuses para quem quer ouvir.`);
      pista('As vozes do cristal do Ruxithid não são deuses: são entidades que fingem ser deuses.');
    }
    pista('As três lascas que faltam do obelisco: Talhundereth, a Cripta dos Talhund e a Travessia da Forca.');
    await painel(linhas);
    const vivos = todos();
    const xp = [ruxithid, guardiao, ...reforco].filter((f) => f && (f.dead || f.rendido || hasCondition(f, 'inerte'))).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (xp && vivos.length) {
      const sobem = darXp(vivos, Math.floor(xp / vivos.length));
      enc.say('cura', `O Ruxithid e a estátua: ${Math.floor(xp / vivos.length)} XP para cada um.`);
      if (sobem.length) for (const l of await telaDeSubirNivel(root, sobem)) enc.say('cura', l);
    }
    // O MARCO (o capítulo 5 vai do 5º ao 7º)
    if (!o5.feito.marco7) {
      o5.feito.marco7 = true;
      const sobem = darMarco(vivos, 7);
      if (sobem.length) for (const l of await telaDeSubirNivel(root, sobem)) enc.say('cura', l);
      enc.say('cura', 'Marco: o Ruxithid caiu (7º nível).');
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const sala = salaDoSantuario(tile);
    // A SAÍDA: a plataforma desce até a ponte das minas (tabuleiro); e, vencido o Ruxithid, o caminho de volta com os
    // reféns é narrado (eles mal andam: ninguém os faz atravessar as minas de casa em casa).
    if (sala === 'elevador') {
      ops.push({ rotulo: 'Descer pela plataforma', icone: 'acao-disparada', detalhe: 'à ponte das minas', motivo: longe(c, tile), fazer: () => {
        estado.encerrado = true;
        root.classList.remove('explorando');
        app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'zorzulaMinas', chegada: 'plataforma', continuarCom: todos() });
      } });
    }
    if (sala === 'elevador' && z.santuario === 'vencido') {
      ops.push({ rotulo: 'Levar os reféns para fora', icone: 'acao-disparada', detalhe: refens.length ? 'de volta à região, com eles' : 'de volta à região', motivo: longe(c, tile), fazer: sair });
    }
    if (sala === 'oeste' && refens.some((r) => !r.dead) && z.santuario === 'vencido' && !z.refensSoltos) {
      ops.push({ rotulo: 'Soltar os reféns', icone: 'acao-curar', motivo: longe(c, tile, 10), fazer: async () => {
        z.refensSoltos = true;
        await painel(['As cordas cedem ao primeiro corte. Os três mal param de pé: magros, de olhos fundos, sem acreditar.', ...REFENS.map((r) => `${r.nome}: ${r.fala}`)]);
        pista('Os reféns: os goblins queriam remontar uma coluna de pedra; outros prisioneiros foram levados para um "propósito especial".');
        app.refresh();
      } });
    }
    return ops;
  }

  async function sair() {
    estado.encerrado = true;
    if (refens.length) z.refensSalvos = true;
    await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Repouso de Zorzula', texto: [
      'A plataforma de pedra desce trinta segundos, devagar, até a ponte sobre a lava. Daí, as minas escuras e o elevador até o posto, com os reféns apoiados em ombros. Os goblins que ainda estão por lá se afastam, sem o chefe, curiosos e mansos.',
      refens.length ? 'Lá fora o ar é fresco, e os três reféns choram de alívio. Falta levá-los inteiros até Phandalin.' : 'Lá fora o ar é fresco.',
    ] }] });
    root.classList.remove('explorando');
    const grupo = todos();
    app.capitulo = null; app.enc = null; app.board = null; app.selected = null; app.mode = null;
    // `regiao.js` é importado só aqui: ele traz a tela da região (CSS, pintura), que o Node dos testes não carrega
    const { abrirRegiao } = await import('./regiao.js');
    abrirRegiao(app, { grupo, onde: 'zorzula' });
  }

  return {
    lugar: 'O Santuário Índigo',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      // A PLATAFORMA (o livro: sobe e desce sozinha, e para um minuto em cada ponta): quem chega à boca do poço a vê subir
      const poco = enc.field.sobreposicoes?.find((o) => o.id === 'pocoVazio');
      if (poco?.ligada && herois().some((h) => salaDoSantuario(h.pos) === 'elevador')) {
        z.santuarioPlataforma = true;
        enc.field.alternarSobreposicao('pocoVazio', false);
        if (z.santuario !== 'vencido') enc.field.alternarSobreposicao('pocoEnergia', true);
        enc.say('acao', 'Um zumbido sobe pelo poço, e a plataforma de pedra aparece, devagar, e para no lugar com um baque surdo.');
        app.refresh();
      }
      // A conversa abre quando alguém sai da ala dos reféns ou do elevador para o salão
      if (estado.explorando && !z.santuario && herois().some((h) => salaDoSantuario(h.pos) === 'salao')) return conversa();
      return null;
    },
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    elenco: { ruxithid, guardiao, refens },
    async iniciar() {
      for (const r of refens) { r.side = 'neutro'; r.facingVec = { dx: 1, dy: 0 }; enc.addCombatant(r); }
      if (ruxithid) { ruxithid.side = 'neutro'; ruxithid.facingVec = { dx: 0, dy: 1 }; enc.addCombatant(ruxithid); }
      if (guardiao) { guardiao.side = 'neutro'; guardiao.facingVec = { dx: 0, dy: 1 }; enc.addCombatant(guardiao); }
      if (config.comoPresos) {
        z.foiPreso = true;
        for (const [i, h] of todos().entries()) h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(P.presos[i] ?? P.presos[0]) ?? P.presos[0]) };
        await painel(['As cordas estão mal amarradas: goblin não sabe dar nó. Em poucos minutos, de pulsos esfolados, todo mundo está solto.',
          'É uma ala de pedra polida, sem porta, aberta para um salão de luz azul. De lá vem uma voz mansa, falando sozinha.']);
      } else if (!z.santuarioVisto) {
        await painel('A plataforma de pedra sobe trinta segundos e para. Duas cascatas de lava azul descem pelas paredes, uma de cada lado, e iluminam um salão de obsidiana polida. Ao fundo, a estátua de uma anã sorridente, rachada, e atrás dela, no alto, um mezanino.');
      }
      z.santuarioVisto = true;
      if (z.santuario === 'vencido') enc.field.alternarSobreposicao?.('pedestalVazio', true);
      // PRESOS, o grupo chega desacordado, e a plataforma está lá embaixo: o poço fica vazio até alguém ir até ela
      if (config.comoPresos && !z.santuarioPlataforma) enc.field.alternarSobreposicao?.('pocoVazio', true);
      // A PLATAFORMA COM ENERGIA (a peça "EnergyLift" da FA): o cristal do Ruxithid move o santuário, e enquanto ele vive a
      // plataforma brilha do mesmo verde do pedestal; vencido, ela fica apagada. O livro não dá o momento: é o do pedestal.
      const pocoVazio = enc.field.sobreposicoes?.find((o) => o.id === 'pocoVazio')?.ligada;
      if (z.santuario !== 'vencido' && !pocoVazio) enc.field.alternarSobreposicao?.('pocoEnergia', true);
      prepararExploracao();
    },
  };
}
