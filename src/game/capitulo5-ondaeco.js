// A CAVERNA ONDA ECO (Parte 4 da aventura). Mapa em `game/ondaeco.js`, lido da imagem do mapa de batalha
// por `src/dev/mapa-ondaeco.py`; as peças em `ondaeco-objetos.json`, os textos em `ondaeco-dados.js`.
//
// O QUE ESTA FASE É: a masmorra do fim. Vinte áreas, quase todas com um bando ou um achado, e o Aranha
// Negra no templo do canto noroeste. O grupo entra pelo sudoeste (área 1) e escolhe o caminho: o fosso da
// entrada leva às minas (2) e à velha entrada (3); dali, às salas e às cavernas. Nenhum bando persegue o
// grupo pelo mapa inteiro: cada um acorda quando alguém pisa na área dele (por área, nunca por raio, que
// vazaria por cima de parede). O grupo chega aqui no 4º nível ou perto, e sai no 5º.
//
// AS REGRAS são do livro; o TEXTO é nosso. Os fatos que ficam: o drow Nezznar procura a Forja das Magias;
// os irmãos Buscapedra acharam a entrada e um morreu; os mortos-vivos e os monstros da mina travaram a
// exploração dele; Nundro está preso nos aposentos do sacerdote.
//
// O estado mora em `app.campanha.ondaEco` e sobrevive a sair e voltar.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA, Battlefield } from '../core/grid.js';
import { d20, damageRoll } from '../core/dice.js';
import { skillBonus, passivePerception, saveBonus, SKILL_NAME } from '../rules/abilities.js';
import { addCondition } from '../rules/conditions.js';
import { criarBuscas } from './buscas.js';
import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { itemDeId, garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { ONDA_ECO } from './ondaeco.js';
import { guardar } from './comercio.js';
import { grupoTem } from './saque.js';
import { paginasDoEpilogo } from './epilogo.js';
import { TEXTOS, EXAMES, arvoreDeMormesk, arvoreDoEspectador, arvoreDeNezznar, arvoreDeNundro } from './ondaeco-dados.js';

const MOVIMENTO = 60;
const AREA_DE = new Map();
for (const [id, cs] of Object.entries(ONDA_ECO.areas)) for (const c of cs) AREA_DE.set(`${c.x},${c.y}`, id);
const areaDe = (p) => AREA_DE.get(`${p.x},${p.y}`) ?? null;
const naArea = (p, id) => areaDe(p) === id;
const CELULAS_DE = (id) => new Set((ONDA_ECO.salas?.[id] ?? []).map((c) => `${c.x},${c.y}`));
const CHAVE_DE = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;

export function criarOndaEco(app) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const salvo = (camp.ondaEco ??= {});
  salvo.buscas ??= {};
  salvo.gas ??= {};
  const buscas = criarBuscas(salvo.buscas);
  const estado = { explorando: false, encerrado: false, lutando: null, reforcos: [], vagando: null };
  let rotaDoMovimento = [];

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;
  const teste = (c, pericia, cd) => {
    const r = d20(enc.rng, skillBonus(c, pericia));
    return { quem: c.name, pericia: SKILL_NAME[pericia], total: r.total, cd, passou: r.total >= cd };
  };
  const salvaguarda = (c, atributo, cd) => {
    const r = d20(enc.rng, saveBonus(c, atributo));
    return { quem: c.name, total: r.total, cd, passou: r.total >= cd };
  };
  const painel = (texto, extra = {}) => narrar(root, { formato: 'painel', paginas: [{ texto: [].concat(texto), ...extra }] });
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const tem = (id) => herois().some((h) => (h.bag ?? []).some((i) => i.id === id && i.qtd > 0));
  // O livro pede FERRAMENTAS DE LADRÃO para arrombar o cofre dos avaliadores e a porta dos aposentos do sacerdote.
  const semFerramentas = (c) => (garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeLadrao' && i.qtd > 0) ? null : `${c.name} não tem ferramentas de ladrão`);

  // ------------------------------------------------------- o elenco ----
  // AS CASAS VÊM DO MAPA (`ONDA_ECO.ninhos`), escolhidas pelo gerador depois de selar o mapa: toda vaga é
  // chão livre e alcançável, e as Grandes (aranhas, gosma) têm as quatro casas de que precisam.
  const ninho = ONDA_ECO.ninhos;
  const nasce = (tipo, pos, sufixo, nome) => {
    const m = makeMonster(tipo, { ...pos }, sufixo ? { nameSuffix: sufixo } : {});
    if (nome) m.name = nome;
    return m;
  };
  const letras = 'ABCDEFGHIJ';
  const bando = (chave, tipo, lista) => (salvo[chave] ? [] : lista.map((p, i) => nasce(tipo, p, lista.length > 1 ? letras[i] : null)));
  const stirges = bando('stirges', 'stirge', ninho.stirges);
  const esqueletos = bando('esqueletos', 'esqueleto', ninho.esqueletos);
  const ghoulsSul = bando('ghoulsSul', 'ghoul', ninho.ghoulsSul);
  const ghoulsGrande = bando('ghoulsGrande', 'ghoul', ninho.ghoulsGrande);
  const gosma = bando('gosma', 'gelatinaOcre', ninho.gosma);
  const bugbearsNorte = bando('bugbearsNorte', 'bugbear', ninho.bugbearsNorte);
  if (bugbearsNorte[0]) bugbearsNorte[0].name = 'Bugbear maior';
  const zumbis = bando('zumbis', 'zumbi', ninho.zumbis);
  const caveira = bando('zumbis', 'caveiraCandente', ninho.caveira);
  const bugbearsFenda = bando('fenda', 'bugbear', [...ninho.bugbearsFenda, ...ninho.bugbearGuarda]);
  const vhalak = salvo.fenda ? [] : [nasce('doppelganger', ninho.vhalak[0], null, 'Vhalak (drow)')];
  const nezznar = salvo.templo ? null : nasce('nezznar', ninho.nezznar[0], null, 'Nezznar');
  const bugbearsTemplo = bando('templo', 'bugbear', ninho.bugbearsTemplo);
  const aranhasTemplo = bando('templo', 'aranhaGigante', ninho.aranhasTemplo);
  const mormesk = salvo.mormesk === 'morto' ? null : nasce('mormesk', ninho.mormesk[0]);
  const espectador = ['dispensado', 'morto'].includes(salvo.espectador) ? null : nasce('spectator', ninho.espectador[0], null, 'Espectador');
  const nundro = makeNpc('gundren', { ...ninho.nundro[0] });
  nundro.name = 'Nundro';

  // Cada bando, com o que o fim da luta faz dele: a chave que se marca, o motivo do XP e o texto.
  const BANDOS = [
    { chave: 'stirges', lista: stirges, xp: 'Os stirges da velha entrada', fim: TEXTOS.fimStirges },
    { chave: 'esqueletos', lista: esqueletos, xp: 'Os esqueletos da guarita', fim: TEXTOS.fimEsqueletos },
    { chave: 'ghoulsSul', lista: ghoulsSul, xp: 'Os ghouls do alojamento sul', fim: TEXTOS.fimGhoulsSul },
    { chave: 'ghoulsGrande', lista: ghoulsGrande, xp: 'O bando de ghouls da grande caverna', fim: TEXTOS.fimGhoulsGrande },
    { chave: 'gosma', lista: gosma, xp: 'A gosma ocre dos túneis', fim: TEXTOS.fimGosma },
    { chave: 'bugbearsNorte', lista: bugbearsNorte, xp: 'Os bugbears do alojamento norte', fim: TEXTOS.fimBugbearsNorte },
    { chave: 'zumbis', lista: [...zumbis, ...caveira], xp: 'Os mortos da fundição', fim: TEXTOS.fimZumbis },
    { chave: 'fenda', lista: [...bugbearsFenda, ...vhalak], xp: 'Os servos de Nezznar na caverna desmoronada', fim: TEXTOS.fimFenda },
    { chave: 'templo', lista: [...(nezznar ? [nezznar] : []), ...bugbearsTemplo, ...aranhasTemplo], xp: 'Nezznar, o Aranha Negra', fim: TEXTOS.fimTemplo },
  ];
  const valeDoBando = (b) => b.reduce((s, f) => s + (f.xp ?? 0), 0);
  const furtividadeDe = (b) => b.map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total);

  // REFORÇOS: os bugbears da caverna desmoronada ouvem a luta do templo e chegam três rodadas depois.
  function prepararReforcos(porRodada) {
    estado.reforcos = [];
    const trazer = (ate) => {
      const chaves = Object.keys(porRodada).map(Number).sort((a, b) => a - b).filter((k) => k <= ate);
      for (const k of chaves) {
        const l = porRodada[k];
        const units = l.bando.filter((f) => !f.dead && !enc.combatants.includes(f));
        if (!units.length) continue;
        l.antes?.();
        for (const f of units) f.side = 'foes';
        estado.reforcos.push(...units);
        return { units, aviso: l.aviso };
      }
      return null;
    };
    enc.reinforcements = (rodada) => trazer(rodada);
    enc.lotePendente = () => trazer(Infinity);
  }

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.lotePendente = null;
    estado.reforcos = [];
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

  function luta(quem, surpresa = null) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (enc.combatants.includes(f)) continue;
      const grande = (f.size ?? f.tamanho) === 'grande';
      const pegada = grande ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
      if (pegada.some(([dx, dy]) => enc.occupied(f.pos.x + dx, f.pos.y + dy, f))) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = quem;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'nossa'
      ? { emboscadores: 'party', furtividade: herois().map(() => 20) }
      : (surpresa === 'deles' || surpresa?.furt)
        ? { emboscadores: 'foes', furtividade: surpresa?.furt ?? quem.map(() => 13) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function darXpDaLuta(xp, motivo) {
    const grupo = enc.combatants.filter((x) => x.side === 'party' && !x.dead);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  const tirarDoTabuleiro = (f) => {
    const i = enc.combatants.indexOf(f);
    if (i >= 0) enc.combatants.splice(i, 1);
  };
  const entrarNeutro = (f, olhaPara = { dx: 1, dy: 0 }) => {
    f.side = 'neutro';
    f.facingVec = olhaPara;
    if (!enc.combatants.includes(f)) enc.addCombatant(f);
  };

  // ----------------------------------------------- o que acorda cada área ----
  // Os mortos de cinza ficam deitados: levantar custa metade do deslocamento (como em Árvore Trovão).
  const deitados = (b) => { for (const f of b) if (!f.dead) addCondition(f, 'caido'); };

  async function acordarStirges() {
    salvo.stirges = 'luta';
    const furt = furtividadeDe(stirges.slice(0, 1));
    await painel(TEXTOS.stirges, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // Uma rolagem de Furtividade para todos (o livro): quem tem Percepção passiva menor é pego de surpresa.
    luta(stirges.filter((f) => !f.dead), { furt: stirges.map(() => furt[0]) });
  }
  async function acordarEsqueletos() {
    salvo.esqueletos = 'luta';
    await painel(TEXTOS.esqueletos, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // O livro: os ossos só se juntam no turno DEPOIS da entrada, então o grupo age primeiro (os esqueletos perdem a rodada 1).
    luta(esqueletos.filter((f) => !f.dead), 'nossa');
  }
  async function acordarGhoulsSul() {
    salvo.ghoulsSul = 'luta';
    await painel(TEXTOS.ghoulsSul, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(ghoulsSul.filter((f) => !f.dead));
  }
  async function acordarGhoulsGrande() {
    salvo.ghoulsGrande = 'luta';
    await painel(TEXTOS.ghoulsGrande, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(ghoulsGrande.filter((f) => !f.dead));
  }
  async function acordarGosma(sozinho) {
    salvo.gosma = 'luta';
    // Ela vinha seguindo o grupo desde que entrou nos túneis: sai da parede a poucas casas de quem ficou para trás.
    if (sozinho && gosma[0]) gosma[0].pos = { ...gosma[0].pos, ...(enc.casaLivreMaisProxima({ x: sozinho.pos.x + 3, y: sozinho.pos.y, f: 2 }) ?? sozinho.pos) };
    await painel(TEXTOS.gosma, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(gosma.filter((f) => !f.dead));
  }
  async function acordarBugbearsNorte() {
    salvo.bugbearsNorte = 'luta';
    await painel(TEXTOS.bugbearsNorte, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    luta(bugbearsNorte.filter((f) => !f.dead));
  }
  async function acordarZumbis() {
    salvo.zumbis = 'luta';
    await painel(TEXTOS.zumbis, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    const b = zumbis.filter((f) => !f.dead);
    deitados(b);
    luta([...b, ...caveira.filter((f) => !f.dead)]);
  }
  async function acordarFenda() {
    salvo.fenda = 'luta';
    await painel(TEXTOS.fenda, { escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
    // O livro: com dois ou mais bugbears mortos, o doppelganger recua para o templo para avisar Nezznar. Ele sai do campo
    // vivo (não dá XP agora) e espera no templo, onde se faz passar por Nundro.
    enc.antesDoTurno = (m) => {
      if (!vhalak[0] || m !== vhalak[0] || m.dead || m.recuou) return false;
      if (bugbearsFenda.filter((f) => f.dead).length < 2) return false;
      m.recuou = true;
      salvo.vhalakRecuou = true;
      salvo.aranhasAvisadas = true;           // ele corre para avisar Nezznar: as aranhas já estão de pé quando o grupo chegar
      tirarDoTabuleiro(m);
      enc.say('acao', TEXTOS.vhalakRecua);
      enc.checkEnd();
      app.refresh();
      return true;
    };
    luta([...bugbearsFenda, ...vhalak].filter((f) => !f.dead));
  }

  // O DOPPELGANGER NO TEMPLO: se recuou, faz-se passar por Nundro amarrado ao lado de Nezznar (barganha para o grupo se
  // render). Se o Nundro de verdade já foi libertado o truque não vale, e Vhalak só se junta à luta como drow.
  let vhalakNoTemplo = null;
  let refemFalso = null;
  const vhalakDoTemplo = () => vhalak[0] ?? (vhalakNoTemplo ??= nasce('doppelganger', ninho.vhalak[0], null, 'Vhalak (drow)'));
  const haRefem = () => Boolean(salvo.vhalakRecuou && !salvo.templo && salvo.nundro !== 'livre');
  function posicionarRefem() {
    if (!haRefem() || !nezznar || refemFalso) return;
    refemFalso = makeNpc('gundren', casaPerto({ x: nezznar.pos.x + 1, y: nezznar.pos.y + 1 }), { side: 'neutro' });
    refemFalso.name = 'Nundro';
    refemFalso.refem = true;
    refemFalso.falas = ['Por trás do pano, ele geme e olha de vocês para o drow, depressa, como quem pede ajuda.'];
    refemFalso.facingVec = { dx: 0, dy: 1 };
    enc.addCombatant(refemFalso);
  }
  /**
   * O doppelganger na luta do templo. Revelado pela Intuição ele entra já (`'revelado'`); senão o "Nundro" continua
   * amarrado na rodada 1 e a máscara cai na rodada 2 (o livro o põe como barganha, não como combatente de abertura).
   */
  function vhalakDaLuta() {
    if (!salvo.vhalakRecuou || salvo.templo) return null;
    const v = vhalakDoTemplo();
    if (v.dead) return null;
    v.pos = refemFalso ? { ...refemFalso.pos } : { ...casaPerto({ x: nezznar.pos.x, y: nezznar.pos.y + 1 }) };
    v.facingVec = refemFalso?.facingVec ?? { dx: 1, dy: 0 };
    return v;
  }
  const tirarRefem = () => { if (refemFalso) { tirarDoTabuleiro(refemFalso); refemFalso = null; } };

  // O GÁS DOS FUNGOS (área 8): quem atravessa a caverna solta o gás do tapete. Salvaguarda de Constituição
  // CD 11 de todos que estão lá; falhou, 3d6 de veneno e envenenado por dez minutos. O gás some em um minuto, e
  // quem termina o turno lá dentro repete — aqui, a cada quatro passos dentro da caverna.
  async function gasDosFungos(quemAndou) {
    const dentro = herois().filter((h) => naArea(h.pos, '8'));
    if (!dentro.length) { salvo.gas = {}; return; }
    // O tapete solta o gás quando ALGUÉM anda por cima dele: no primeiro passo dentro da caverna, e depois a cada
    // dois movimentos de quem está lá. Todos os que estão na caverna fazem a salvaguarda.
    if (!naArea(quemAndou.pos, '8')) return;
    // O tapete solta o gás na ENTRADA e depois a cada 30 pés andados lá dentro (uma rodada de marcha): o número de
    // cliques não importa, só a distância. Todos os que estão na caverna fazem a salvaguarda.
    const pes = 5 * (rotaDoMovimento.filter((p) => areaDe(p) === '8').length || 1);
    const antes = salvo.gas[quemAndou.id] ?? null;
    const depois = (antes ?? -30) + pes;
    salvo.gas[quemAndou.id] = depois;
    const eventos = antes === null ? 1 : Math.floor(depois / 30) - Math.floor(antes / 30);
    if (eventos <= 0) return;
    const alvos = dentro;
    const falharam = [];
    for (const h of alvos) {
      const s = salvaguarda(h, 'con', 11);
      if (s.passou) continue;
      const dano = damageRoll(enc.rng, '3d6');
      enc.applyDamage(h, dano.total, 'veneno', null, {});
      addCondition(h, 'envenenado', { rounds: 100, source: 'gas' });
      falharam.push(`${h.name} (${dano.total})`);
    }
    if (!salvo.viuGas) {
      salvo.viuGas = true;
      await painel(TEXTOS.gas);
    }
    enc.say('acao', falharam.length ? `O gás dos fungos pega ${falharam.join(', ')}: veneno.` : 'O gás sobe do tapete de fungos, mas ninguém se engasga.');
    app.refresh();
  }

  // ------------------------------------------------- as conversas ----
  const temOferta = () => herois().some((h) => (h.bag ?? []).some((i) => (itemDeId(i.id)?.dados.raridade ?? null) && i.qtd > 0));
  const arvoreDe = (npc) => {
    if (mormesk && npc === mormesk) return arvoreDeMormesk({ salvo, tem: temOferta });
    if (espectador && npc === espectador) return arvoreDoEspectador({ salvo });
    if (nezznar && npc === nezznar) return arvoreDeNezznar({ refem: Boolean(refemFalso) });
    if (npc === nundro) return arvoreDeNundro({ salvo });
    return null;
  };
  // O que cada conversa decide (a mesma saída vale quando a conversa abre sozinha e quando o jogador clica no NPC).
  async function resolver(npc, fim) {
    if (mormesk && npc === mormesk) {
      if (fim === 'luta') { salvo.mormesk = 'luta'; luta([mormesk]); }
      else if (fim === 'acordo') {
        salvo.mormesk = 'acordo';
        pista('Mormesk, o espectro dos aposentos dos magos, promete o tesouro e o acesso aos livros a quem acabar com o espectador da Forja das Magias.');
      }
    } else if (espectador && npc === espectador) {
      if (fim === 'luta') { salvo.espectador = 'luta'; luta([espectador]); }
      else if (fim === 'dispensado') {
        salvo.espectador = 'dispensado';
        tirarDoTabuleiro(espectador);
        await painel(TEXTOS.espectadorSome);
        await darXpDaLuta(valeDoBando([espectador]), 'O espectador, convencido a partir');
        app.refresh();
      }
    } else if (nezznar && npc === nezznar) {
      if (['luta', 'luta-surpresa', 'luta-revelado'].includes(fim)) {
        // Revelado pela Intuição: a máscara cai agora, o grupo está alerta e as aranhas não pegam ninguém de surpresa.
        if (fim === 'luta-revelado') {
          if (refemFalso) await painel(TEXTOS.refemRevela);
          iniciarTemplo('alerta', 'revelado');
        } else iniciarTemplo(fim === 'luta-surpresa' ? 'nossa' : null, 'tarde');
      }
    } else if (npc === nundro && fim === 'resgatado') {
      salvo.nundro = 'livre';
      feitos.nundroResgatado = true;
      await painel(TEXTOS.nundroLivre);
      // 200 XP se ele sobreviver à aventura: já pagos se Nezznar caiu; senão, na queda dele.
      if (salvo.templo === 'limpo') { salvo.nundroPago = true; await darXpDaLuta(200, 'Nundro resgatado'); }
    }
  }
  async function conversaDe(npc, olhaPara) {
    entrarNeutro(npc, olhaPara);
    const r = await app.conversarCom(npc, arvoreDe(npc));
    await resolver(npc, r);
  }
  const conversaDeMormesk = () => { salvo.mormeskVisto = true; return conversaDe(mormesk, { dx: 0, dy: 1 }); };
  const conversaDoEspectador = () => { salvo.espectadorVisto = true; return conversaDe(espectador, { dx: -1, dy: 0 }); };
  const conversaDeNezznar = async () => { salvo.temploVisto = true; posicionarRefem(); await conversaDe(nezznar, { dx: 1, dy: 0 }); };
  // A luta final: Nezznar, os dois bugbears da mesa e as quatro aranhas (que se escondem atrás dos pilares).
  function iniciarTemplo(surpresa = null, vhalakQuando = null) {
    salvo.templo = 'luta';
    // As aranhas se escondem atrás dos pilares; mexer na porta do sacerdote (arrombar) as avisou, e elas já estão de pé.
    const furt = (salvo.aranhasAvisadas || surpresa === 'alerta') ? null : furtividadeDe(aranhasTemplo);
    // Do corredor chegam os DOIS bugbears que escalam as cordas da fenda (o guarda fica de vigia). O doppelganger, se recuou
    // da 18, já está aqui: faz-se passar por Nundro e só tira a máscara quando a luta começa (`revelarVhalak`).
    const nivel = herois().reduce((s, h) => s + h.level, 0) / Math.max(1, herois().length);
    const quantas = nivel >= 4.5 ? { aranhas: 4, bugbears: 2, reforco: 2 } : { aranhas: 2, bugbears: 1, reforco: 0 };
    const reforco = bugbearsFenda.slice(0, quantas.reforco).filter((f) => !f.dead);
    for (const [i, f] of reforco.entries()) f.name = `Bugbear da fenda ${letras[i]}`;
    const ondas = {};
    if (reforco.length) ondas[3] = { bando: reforco, aviso: 'Do corredor chegam passos pesados: o que sobrou da caverna desmoronada ouviu a luta.' };
    const vhalakAgora = vhalakQuando ? vhalakDaLuta() : null;
    let extras = [];
    if (vhalakAgora && vhalakQuando === 'revelado') { tirarRefem(); extras = [vhalakAgora]; }
    else if (vhalakAgora) {
      // Na rodada 2: se havia "Nundro" amarrado, ele se livra das cordas e tira a máscara; senão, o drow franzino chega atrasado.
      const mascara = Boolean(refemFalso);
      ondas[2] = { bando: [vhalakAgora], antes: tirarRefem, aviso: mascara ? TEXTOS.refemRevela : TEXTOS.vhalakChega };
    }
    if (Object.keys(ondas).length) prepararReforcos(ondas);
    // O grupo entra JUNTO: quem ficou no corredor de duas casas é puxado para a entrada do templo (a luta é de todos).
    const ref = herois().find((h) => naArea(h.pos, '19')) ?? herois()[0];
    for (const h of herois()) {
      if (naArea(h.pos, '19') || distanceFt(h.pos, ref.pos) <= 15) continue;
      h.pos = { ...h.pos, ...casaPerto(ref.pos) };
    }
    // O LIVRO é para o 5º nível. Um grupo mais verde que isso chega ao templo e perde sempre (medido: 0% de vitória nos níveis 3 e
    // 4), então o DMG manda ajustar: menos aranhas e bugbears para quem chega mais fraco, e nada de Vhalak extra no nível 3.
    const aranhas = aranhasTemplo.slice(0, quantas.aranhas);
    const bugbears = bugbearsTemplo.slice(0, quantas.bugbears);
    if (nivel < 3.5) extras = [];          // no nível 3 o doppelganger não entra: o resto já pesa
    luta([nezznar, ...bugbears, ...aranhas, ...extras].filter((f) => !f.dead), surpresa === 'nossa' ? 'nossa' : (furt ? { furt } : null));
  }

  // MONSTROS VAGANDO (o livro): nenhuma parte da mina é segura. Quem gasta muito tempo num lugar (um descanso)
  // rola um d20, e 17 a 20 é um encontro: um d12 diz quem. Eles chegam de uns 30 pés, pelo lado que o mapa
  // deixar, e sempre à vista de quem estiver acordado.
  const TABELA_VAGANDO = [
    [3, 'stirge', '2d4', 'stirges'], [5, 'ghoul', '1d4', 'ghouls'], [6, 'grick', '1d4', 'gricks'], [8, 'bugbear', '1d4', 'bugbears'],
    [9, 'esqueleto', '1d6', 'esqueletos'], [10, 'zumbi', '1d6', 'zumbis'], [12, 'gelatinaOcre', '1', 'uma gosma ocre'],
  ];
  async function monstroVagando() {
    const dado = (n) => 1 + Math.floor(enc.rng() * n);
    if (dado(20) < 17) return false;
    const r = dado(12);
    const [, tipo, qtd, nome] = TABELA_VAGANDO.find(([ate]) => r <= ate);
    const [n, faces] = qtd.includes('d') ? qtd.split('d').map(Number) : [Number(qtd), 1];
    let quantos = 0;
    for (let i = 0; i < n; i += 1) quantos += faces > 1 ? dado(faces) : 1;
    const centro = herois()[0].pos;
    // Só onde o grupo ALCANÇA (portas no estado de agora: a IA não abre porta) e onde a pegada cabe.
    const alc = enc.field.reachable(centro, 100000, () => false);
    const grande = tipo === 'gelatinaOcre';
    const cabe = (x, y) => (grande ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]]).every(([dx, dy]) => (
      enc.field.inside(x + dx, y + dy) && !enc.field.blocksMove(x + dx, y + dy) && alc.has(`${x + dx},${y + dy}`) && !enc.occupied(x + dx, y + dy)));
    const volta = [];
    for (let k = 0; k < 600 && volta.length < quantos; k += 1) {
      const x = centro.x + Math.round((enc.rng() - 0.5) * 16);
      const y = centro.y + Math.round((enc.rng() - 0.5) * 16);
      if (Math.abs(x - centro.x) + Math.abs(y - centro.y) < 5 || areaDe({ x, y }) === null) continue;
      if (volta.some((v) => Math.abs(v.x - x) < 2 && Math.abs(v.y - y) < 2)) continue;
      if (!cabe(x, y) || (grande && enc.field.paredeNaPegada?.(x, y, 2))) continue;
      volta.push({ x, y });
    }
    if (!volta.length) return false;
    const bando = volta.map((p, i) => nasce(tipo, p, volta.length > 1 ? letras[i] : null));
    estado.vagando = bando;
    await painel(TEXTOS.vagando(nome));
    luta(bando);
    return true;
  }

  // ------------------------------------------------------ a aproximação ----
  async function depoisDeMover(c) {
    if (!estado.explorando || !c) return;
    c.movementLeftFt = MOVIMENTO;
    // Um movimento de 60 pés pode atravessar uma área e terminar fora dela: vale o caminho inteiro (da casa onde o
    // herói estava até onde parou), e não só o ponto final.
    const antes = (estado.ultima ??= {})[c.id];
    estado.ultima[c.id] = { x: c.pos.x, y: c.pos.y };
    let rota = [];
    if (antes && (antes.x !== c.pos.x || antes.y !== c.pos.y)) {
      const alc = enc.field.reachable(antes, 100000, () => false);
      rota = Battlefield.pathFrom(alc, { x: c.pos.x, y: c.pos.y }) ?? [];
    }
    const aqui = (id) => herois().some((h) => naArea(h.pos, id)) || rota.some((p) => areaDe(p) === id);
    // AS ONDAS ESTRONDOSAS: de tempos em tempos o estrondo chega pela pedra, mais forte para o nordeste.
    salvo.passos = (salvo.passos ?? 0) + 1;
    if (salvo.passos % 30 === 0) enc.say('acao', c.pos.x > 48 && c.pos.y < 30 ? TEXTOS.ondaPerto : TEXTOS.ondaLonge);
    rotaDoMovimento = rota;
    if (aqui('8')) await gasDosFungos(c); else salvo.gas = {};
    if (stirges.length && !salvo.stirges && aqui('3')) { await acordarStirges(); return; }
    if (esqueletos.length && !salvo.esqueletos && aqui('4')) { await acordarEsqueletos(); return; }
    if (ghoulsSul.length && !salvo.ghoulsSul && aqui('6')) { await acordarGhoulsSul(); return; }
    if (ghoulsGrande.length && !salvo.ghoulsGrande && aqui('9')) { await acordarGhoulsGrande(); return; }
    if (bugbearsNorte.length && !salvo.bugbearsNorte && aqui('11')) { await acordarBugbearsNorte(); return; }
    if ((zumbis.length || caveira.length) && !salvo.zumbis && aqui('12')) { await acordarZumbis(); return; }
    if (bugbearsFenda.length && !salvo.fenda && aqui('18')) { await acordarFenda(); return; }
    // A gosma ocre dos túneis segue o grupo e ataca quem fica sozinho.
    if (gosma.length && !salvo.gosma && aqui('2')) {
      const sozinho = herois().find((h) => naArea(h.pos, '2') && herois().every((o) => o === h || distanceFt(o.pos, h.pos) > 20));
      if (sozinho) { await acordarGosma(sozinho); return; }
    }
    if (mormesk && !salvo.mormeskVisto && aqui('14')) { await conversaDeMormesk(); return; }
    if (espectador && !salvo.espectadorVisto && aqui('15')) { await conversaDoEspectador(); return; }
    if (nezznar && !salvo.temploVisto && salvo.templo !== 'luta' && aqui('19')) { await conversaDeNezznar(); return; }
    // O TEXTO DE ENTRADA de cada área que não tem encontro: uma vez só.
    for (const a of Object.keys(TEXTOS.entrada)) {
      if (!salvo.vista?.[a] && aqui(a)) { (salvo.vista ??= {})[a] = true; await painel(TEXTOS.entrada[a]); }
    }
    if (!salvo.sonsDaOnda && (aqui('16') || aqui('17'))) {
      salvo.sonsDaOnda = true;
      await painel(TEXTOS.ondas);
    }
  }

  // ----------------------------------------------------------- fim da luta ----
  async function fimDoCombate(outcome) {
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Caverna Onda Eco', texto: [TEXTOS.derrota] }] });
      app.encerrarPartida();
      return;
    }
    const lutou = estado.lutando ?? [];
    const reforcos = estado.reforcos ?? [];
    const todos = [...new Set([...lutou, ...reforcos])];
    const dos = (lista) => lutou.some((f) => lista.includes(f));
    const total = (lista) => valeDoBando([...new Set([...lista, ...reforcos.filter((f) => f.dead), ...lutou.filter((f) => f.defId === 'doppelganger')])].filter((f) => f.dead || f.capturado));
    if (estado.vagando && dos(estado.vagando)) {
      const xp = valeDoBando(estado.vagando);
      estado.vagando = null;
      await painel(TEXTOS.fimVagando);
      await darXpDaLuta(xp, 'Os que vagavam pela mina');
    } else if (mormesk && lutou.includes(mormesk)) {
      salvo.mormesk = 'morto';
      await painel(TEXTOS.fimMormesk);
      await darXpDaLuta(valeDoBando([mormesk]), 'Mormesk');
      app.refresh();
    } else if (espectador && lutou.includes(espectador)) {
      salvo.espectador = 'morto';
      await painel(TEXTOS.fimEspectador);
      await darXpDaLuta(valeDoBando([espectador]), 'O espectador');
    } else {
      // O templo vem primeiro: Vhalak está na lista da fenda e, se recuou, luta aqui; a luta é do templo.
      for (const b of [...BANDOS].sort((x, y) => (y.chave === 'templo') - (x.chave === 'templo'))) {
        if (!dos(b.lista)) continue;
        salvo[b.chave] = 'limpo';
        await painel(b.fim);
        if (b.chave === 'templo') await fimDoTemplo();
        if (b.chave === 'bugbearsNorte') await bolsaDoBugbearMaior();
        await darXpDaLuta(total(b.lista), b.xp);
        // os bugbears da fenda que vieram de reforço contam como limpos também
        if (b.chave === 'templo' && [...bugbearsFenda, ...vhalak].every((f) => f.dead)) salvo.fenda = 'limpo';
        break;
      }
    }
    prepararExploracao();
  }

  // O bugbear maior leva uma bolsa: 15 pc, 13 pe (65 pp) e uma poção da vitalidade.
  async function bolsaDoBugbearMaior() {
    const quem = herois()[0];
    if (!quem) return;
    guardar(quem, 'moedaDeCobre', 15); guardar(quem, 'moedaDePrata', 65); guardar(quem, 'pocaoDeVitalidade', 1);
    await painel(TEXTOS.bolsaDoBugbear);
  }

  // NEZZNAR VIVO, DE VOLTA A PHANDALIN: entregue a Sildar ou ao chefe da vila, o livro paga o dobro do XP dele. A menos que o
  // grupo guarde a cela, Halia Thornton o solta e o entrega aos Zhentarim (o que acontece depois é do mestre).
  async function entregarNezznar() {
    salvo.nezznarEntregue = true;
    // Se Nezznar foi morto depois de caído (um golpe letal no chão), não há o que entregar.
    if (nezznar?.dead) { salvo.nezznar = 'morto'; feitos.nezznarCapturado = false; return; }
    const escolha = await narrar(root, {
      formato: 'painel',
      paginas: [{ texto: TEXTOS.nezznarEntrega }],
      escolhas: [
        { rotulo: 'Passar a noite à porta da cela', valor: 'guarda', primaria: true },
        { rotulo: 'Deixar a cela fechada à chave e ir dormir', valor: 'cela' },
      ],
    });
    await darXpDaLuta(nezznar?.xp ?? 450, 'Nezznar entregue vivo (XP em dobro)');
    if (escolha === 'cela') {
      feitos.nezznarFugiu = true;
      pista('Nezznar sumiu da cela do salão do chefe da vila: a fechadura estava aberta, e Halia Thornton não sabe de nada.');
      await painel(TEXTOS.nezznarSolto);
    } else {
      pista('Nezznar espera na cela do salão do chefe da vila, sob guarda, até a Aliança dos Lordes escoltá-lo a Neverwinter.');
      await painel(TEXTOS.nezznarGuarda);
    }
  }

  // A QUEDA DE NEZZNAR: o que ele carregava, e o que a aventura fecha.
  async function fimDoTemplo() {
    const quem = herois()[0];
    if (quem) {
      guardar(quem, 'pocaoDeCura', 1);
      // Peça única: se o saque do corpo (`game/saque.js`) já a deu a alguém do grupo, vivo ou morto, não se entrega de novo.
      if (!grupoTem(enc.combatants.filter((x) => x.side === 'party'), 'cajadoAranha')) (quem.weapons ??= []).push('cajadoAranha');
      guardar(quem, 'chaveDoAranhaNegra', 1);
    }
    feitos.nezznarDerrotado = true;
    // PEGO VIVO (golpe não letal): o livro paga o DOBRO do XP dele se for entregue em Phandalin (`entregarNezznar`, na saída).
    if (nezznar?.capturado && !nezznar.dead) {
      salvo.nezznar = 'preso';
      feitos.nezznarCapturado = true;
      await painel(TEXTOS.nezznarPreso);
    }
    if (salvo.nundro === 'livre' && !salvo.nundroPago) { salvo.nundroPago = true; await darXpDaLuta(200, 'Nundro resgatado'); }
    pista('Nezznar, o Aranha Negra, caiu no templo de Dumathoin. A mina está livre, e Nundro está nos aposentos do sacerdote, trancado.');
    await painel(TEXTOS.despojosDeNezznar);
  }

  // ------------------------------------------------------ botão direito ----
  const COM_FOLHA = new Set((ONDA_ECO.folhas ?? []).flatMap(([a, b]) => [CHAVE_DE(a, b), CHAVE_DE(b, a)]));
  enc.field.folha = COM_FOLHA;

  // AS PORTAS TRANCADAS: cada uma tem a perícia e a CD do livro, e as duas folhas de uma porta larga abrem juntas.
  const TRANCADAS = [
    { id: 'alojNorteLeste', folhas: [[{ x: 31, y: 27 }, { x: 32, y: 27 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 20, area: '11',
      texto: 'A trave que os bugbears puseram por dentro estala e a porta cede um palmo, depois inteira.' },
    { id: 'sacerdote', folhas: [[{ x: 15, y: 8 }, { x: 15, y: 9 }], [{ x: 16, y: 8 }, { x: 16, y: 9 }]], rotulo: 'Arrombar a fechadura', pericia: 'prestidigitacao', cd: 15,
      chave: 'chaveDoAranhaNegra', area: '20', texto: 'O ferro cede com um estalo seco, e as duas folhas se abrem para o quarto do sacerdote.' },
    { id: 'forjaNorte', folhas: [[{ x: 67, y: 34 }, { x: 67, y: 35 }], [{ x: 68, y: 34 }, { x: 68, y: 35 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 15, area: '15',
      texto: 'As maçanetas semiderretidas se soltam na mão, e a porta queimada vem junto.' },
    { id: 'magos', folhas: [[{ x: 63, y: 51 }, { x: 64, y: 51 }], [{ x: 63, y: 52 }, { x: 64, y: 52 }]], rotulo: 'Forçar a porta', pericia: 'atletismo', cd: 15, area: '14',
      texto: 'A madeira rachada cede ao ombro, e dentro a poeira de séculos sobe de uma vez.' },
  ];
  for (const t of TRANCADAS) t.aberta = Boolean(salvo.portasAbertas?.[t.id]);
  const tranca = (a, b) => TRANCADAS.find((t) => !t.aberta && t.folhas.some(([u, v]) => (CHAVE_DE(u, v) === CHAVE_DE(a, b)) || (CHAVE_DE(u, v) === CHAVE_DE(b, a))));
  const abrirTranca = (t) => {
    t.aberta = true;
    (salvo.portasAbertas ??= {})[t.id] = true;
    for (const [u, v] of t.folhas) enc.field.porAresta(u.x, u.y, v.x, v.y, ARESTA.aberta);
    enc.field.versao = (enc.field.versao ?? 0) + 1;
  };
  // Ao reabrir a cena num jogo salvo, a porta já arrombada continua aberta.
  for (const t of TRANCADAS) if (t.aberta) for (const [u, v] of t.folhas) enc.field.porAresta(u.x, u.y, v.x, v.y, ARESTA.aberta);

  function portasDaCasa(tile) {
    const f = enc.field;
    const out = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { x: tile.x + dx, y: tile.y + dy };
      if (!f.inside(n.x, n.y)) continue;
      const cod = f.aresta(tile.x, tile.y, n.x, n.y);
      if (cod !== ARESTA.porta && cod !== ARESTA.aberta) continue;
      if (!COM_FOLHA.has(CHAVE_DE(tile, n))) continue;
      out.push({ a: tile, b: n, cod });
    }
    return out;
  }

  const OBJ_EM = new Map((ONDA_ECO.props ?? []).map((p) => [`${p.x},${p.y}`, p.variante]));

  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
    const alcance = () => (distanceFt(c.pos, tile) > 5 ? 'longe demais — chegue a 5 pés'
      : (enc.field.contato(c.pos, tile) ? null : 'tem uma parede no meio'));

    // As PORTAS: abrir e fechar de graça, menos as trancadas (cada uma tem o seu jeito, vindo do livro).
    for (const { a: ca, b: cb, cod } of portasDaCasa(tile)) {
      const t = tranca(ca, cb);
      if (t) {
        const preciso = t.pericia === 'prestidigitacao' ? 'Destreza (ferramentas de ladrão)' : SKILL_NAME[t.pericia];
        ops.push({
          rotulo: t.rotulo, icone: 'acao-empurrar', detalhe: `${preciso} CD ${t.cd}`,
          motivo: longe(5) ?? (t.pericia === 'prestidigitacao' ? semFerramentas(c) : null) ?? buscas.ja(c, `porta-${t.id}`, ca),
          fazer: async () => {
            buscas.marcar(c, `porta-${t.id}`, ca);
            const r = teste(c, t.pericia, t.cd);
            if (!r.passou) { await painel(TEXTOS.portaResiste, { teste: r }); return; }
            abrirTranca(t);
            await painel(t.texto, { teste: r });
            // Mexer na tranca da porta do sacerdote faz barulho: as aranhas do templo ouvem e deixam o esconderijo.
            if (t.id === 'sacerdote' && !salvo.aranhasAvisadas) {
              salvo.aranhasAvisadas = true;
              await painel(TEXTOS.portaAvisa);
            }
            app.refresh();
          },
        });
        if (t.chave && tem(t.chave)) {
          ops.push({
            rotulo: 'Abrir com a chave de Nezznar', icone: 'acao-usarObjeto', detalhe: 'a chave de ponta em bigorna',
            motivo: longe(5),
            fazer: async () => { abrirTranca(t); await painel(TEXTOS.chaveAbre); app.refresh(); },
          });
        }
        ops.push({
          rotulo: 'Escutar à porta', icone: 'acao-procurar', detalhe: 'Percepção CD 10',
          motivo: longe(5) ?? buscas.ja(c, `escuta-${t.id}`, ca),
          fazer: async () => {
            buscas.marcar(c, `escuta-${t.id}`, ca);
            const r = teste(c, 'percepcao', 10);
            await painel(r.passou ? (TEXTOS.escuta[t.id] ?? TEXTOS.escutaNada) : TEXTOS.escutaNada, { teste: r });
          },
        });
        continue;
      }
      const fechada = cod === ARESTA.porta;
      ops.push({
        rotulo: fechada ? 'Abrir a porta' : 'Fechar a porta',
        icone: fechada ? 'acao-usarObjeto' : 'acao-empurrar',
        detalhe: fechada ? 'de graça' : 'corta a visão',
        motivo: longe(5) ?? (enc.combatants.some((o) => !o.dead && o.pos && o !== c && !fechada
          && ((o.pos.x === ca.x && o.pos.y === ca.y) || (o.pos.x === cb.x && o.pos.y === cb.y)))
          ? 'tem alguém na passagem' : null),
        fazer: async () => {
          enc.field.porAresta(ca.x, ca.y, cb.x, cb.y, fechada ? ARESTA.aberta : ARESTA.porta);
          enc.say('acao', fechada ? `${c.name} empurra a porta de pedra, que cede.` : `${c.name} fecha a porta de pedra com o ombro.`);
          app.refresh();
        },
      });
    }

    // EXAMINAR toda peça (texto nosso), e as ações das peças do livro.
    if (sup === 'prop' || sup === 'propBaixo') {
      const v = OBJ_EM.get(`${tile.x},${tile.y}`);
      const texto = v && EXAMES[v];
      if (texto) ops.push({ rotulo: 'Examinar', icone: 'acao-procurar', motivo: alcance(), fazer: () => painel(texto) });
      ops.push(...interacoesDePeca(v, tile, c, { alcance, longe }));
    }
    // Braseiros e fogueira não são peças (têm glifo próprio), mas têm o que examinar.
    if (['braseiro', 'braseiroFrio', 'fogueira'].includes(sup) && EXAMES[sup]) {
      ops.push({ rotulo: 'Examinar', icone: 'acao-procurar', motivo: alcance(), fazer: () => painel(EXAMES[sup]) });
    }
    ops.push(...interacoesDeLugar(tile, sup, c, { alcance, longe }));
    return ops;
  }

  // ------------------------------------------------ os achados do livro ----
  const unica = (chave, c, tile) => buscas.ja(c, chave, tile);

  function interacoesDePeca(v, tile, c, { alcance }) {
    const ops = [];
    const lin = (rotulo, pericia, cd, chave, fazer, extra = {}) => ops.push({
      rotulo, icone: 'acao-procurar', detalhe: `${SKILL_NAME[pericia] ?? pericia} CD ${cd}`,
      motivo: alcance() ?? unica(chave, c, tile) ?? extra.motivo ?? null,
      fazer: async () => { buscas.marcar(c, chave, tile); const r = teste(c, pericia, cd); await fazer(r); },
    });
    if (v === 'anaoMorto' && naArea(tile, '1') && !salvo.tharden) {
      ops.push({
        rotulo: 'Revistar o corpo', icone: 'acao-procurar', detalhe: 'Tharden Buscapedra', motivo: alcance(),
        fazer: async () => {
          salvo.tharden = true;
          guardar(c, 'botasDeMarchaESalto', 1);
          pista('Tharden Buscapedra morreu na entrada da Caverna Onda Eco, e o Aranha Negra não o revistou.');
          await painel(TEXTOS.tharden);
          app.refresh();
        },
      });
    }
    if (v === 'cofreDeFerro' && naArea(tile, '5') && !salvo.cofreAvaliadores) {
      lin('Forçar o cofre', 'prestidigitacao', 20, 'cofreAvaliadores', async (r) => {
        if (!r.passou) { await painel(TEXTOS.cofreResiste, { teste: r }); return; }
        salvo.cofreAvaliadores = true;
        guardar(c, 'moedaDeCobre', 600); guardar(c, 'moedaDePrata', 180 + 450); guardar(c, 'moedaDeOuro', 60);
        await painel(TEXTOS.cofreAvaliadores, { teste: r });
        app.refresh();
      }, { motivo: semFerramentas(c) });
    }
    if (v === 'estatuaDumathoin') {
      lin('Reconhecer a estátua', 'religiao', 10, 'estatuaReligiao', async (r) => {
        await painel(r.passou ? TEXTOS.estatuaReconhece : TEXTOS.estatuaNada, { teste: r });
      });
      lin('Examinar os olhos de perto', 'investigacao', 12, 'estatuaOlhos', async (r) => {
        await painel(r.passou ? TEXTOS.estatuaVidro : TEXTOS.estatuaNada, { teste: r });
      });
      if ((salvo.olhosArrancados ?? 0) < 2) {
        ops.push({
          rotulo: 'Subir e arrancar um olho', icone: 'acao-saltar', detalhe: 'Atletismo CD 10', motivo: alcance() ?? unica('estatuaSobe', c, tile),
          fazer: async () => {
            buscas.marcar(c, 'estatuaSobe', tile);
            const r = teste(c, 'atletismo', 10);
            if (!r.passou) { await painel(TEXTOS.estatuaEscorrega, { teste: r }); return; }
            salvo.olhosArrancados = (salvo.olhosArrancados ?? 0) + 1;
            if (salvo.olhosArrancados < 2) { await painel(TEXTOS.primeiroOlho, { teste: r }); return; }
            await painel(TEXTOS.segundoOlho, { teste: r });
            // O TETO CEDE: cada criatura do templo, Destreza CD 15 ou 4d10 de pedra e caída; no sucesso, metade.
            for (const h of herois().filter((x) => naArea(x.pos, '19'))) {
              const s = salvaguarda(h, 'dex', 15);
              const dano = damageRoll(enc.rng, '4d10').total;
              const sofre = s.passou ? Math.floor(dano / 2) : dano;
              enc.applyDamage(h, sofre, 'concussão', null, {});
              if (!s.passou) addCondition(h, 'caido');
              enc.say('acao', `${h.name} ${s.passou ? 'se joga de lado a tempo' : 'é pego pelo desabamento'}: ${sofre} de pedra.`);
            }
            app.refresh();
          },
        });
      }
    }
    if (v === 'mesaDeGuerra' && naArea(tile, '19')) {
      if (!salvo.sacoNezznar) {
        ops.push({
          rotulo: 'Abrir o saco de couro preto', icone: 'acao-usarObjeto', detalhe: 'o saque de Nezznar',
          motivo: alcance() ?? (nezznar && salvo.templo !== 'limpo' ? 'ele está olhando' : null),
          fazer: async () => {
            salvo.sacoNezznar = true;
            guardar(c, 'moedaDePrata', 950); guardar(c, 'moedaDeOuro', 130); guardar(c, 'moedaDePlatina', 15);
            guardar(c, 'gemaPequena', 9); guardar(c, 'canecaDeEletro', 1);
            await painel(TEXTOS.sacoNezznar);
            app.refresh();
          },
        });
      }
      lin('Ler as notas e os mapas', 'investigacao', 10, 'notasNezznar', async (r) => {
        if (r.passou) pista('Nezznar vem explorando a Caverna Onda Eco palmo a palmo atrás da Forja das Magias, e é a fúria dos mortos-vivos que o segura.');
        await painel(r.passou ? TEXTOS.notasNezznar : TEXTOS.estatuaNada, { teste: r });
      });
    }
    if (v === 'braseiroVerde') {
      lin('Estudar o braseiro', 'arcanismo', 15, 'braseiroArcanismo', async (r) => {
        if (r.passou) pista('O braseiro da Forja das Magias é a fonte da magia que ainda corre pela caverna. Banhada nas chamas por um minuto, uma arma ou armadura comum vira +1 por algumas horas.');
        await painel(r.passou ? TEXTOS.braseiroRevela : TEXTOS.braseiroNada, { teste: r });
      });
      ops.push({
        rotulo: 'Banhar a arma nas chamas', icone: 'acao-usarObjeto', detalhe: 'um minuto: +1 por 1d12 horas',
        motivo: alcance() ?? (salvo.braseiroUsou?.[c.id] ? `${c.name} já se banhou aqui` : null),
        fazer: async () => {
          (salvo.braseiroUsou ??= {})[c.id] = true;
          const horas = 1 + Math.floor(enc.rng() * 12);
          addCondition(c, 'armaMagica', { rounds: horas * 600 });
          await painel(TEXTOS.braseiroBanho(c.name, horas));
          app.refresh();
        },
      });
    }
    if (v === 'bancadaRunas' && naArea(tile, '15') && !salvo.itensForja) {
      ops.push({
        rotulo: 'Pegar a maça e o peitoral', icone: 'acao-usarObjeto', detalhe: 'Criadora da Luz e Proteção Dragão',
        motivo: alcance(),
        fazer: async () => {
          if (espectador && !['dispensado', 'morto'].includes(salvo.espectador)) {
            // Mexer no que a forja guarda é a única coisa que o espectador não perdoa.
            salvo.espectador = 'luta';
            entrarNeutro(espectador);
            await painel(TEXTOS.espectadorAtaca);
            luta([espectador]);
            return;
          }
          salvo.itensForja = true;
          (c.weapons ??= []).push('lightbringer');
          garantirInventario(c).bag.push({ id: 'dragonguard', tipo: 'armadura', qtd: 1 });
          feitos.temLightbringer = true;
          await painel(TEXTOS.itensForja);
          app.refresh();
        },
      });
    }
    if (v === 'estante' && naArea(tile, '14') && !salvo.mapaMormesk) {
      const livre = ['pago', 'morto'].includes(salvo.mormesk) || !mormesk;
      if (!livre) {
        ops.push({ rotulo: 'Procurar o mapa nos tomos', icone: 'acao-procurar', motivo: alcance() ?? 'Mormesk vigia os livros', fazer: () => painel(TEXTOS.mormeskVigia) });
      } else lin('Procurar o mapa nos tomos', 'investigacao', 12, 'tomosMormesk', async (r) => {
        if (!r.passou) { await painel(TEXTOS.tomosNada, { teste: r }); return; }
        salvo.mapaMormesk = true;
        guardar(c, 'mapaDeMormesk', 1);
        pista('Num dos tomos dos aposentos dos magos, um mapa costurado na capa mostra onde fica uma masmorra feita por Mormesk.');
        await painel(TEXTOS.mapaMormesk, { teste: r });
        app.refresh();
      });
    }
    return ops;
  }

  function interacoesDeLugar(tile, sup, c, { alcance, longe }) {
    const ops = [];
    // O baú de ferro dos aposentos dos magos (área 14): o tesouro de Mormesk.
    if (sup === 'bau' && naArea(tile, '14') && !salvo.bauMago) {
      const livre = ['pago', 'morto'].includes(salvo.mormesk);
      ops.push({
        rotulo: 'Abrir o baú', icone: 'acao-usarObjeto', detalhe: 'o tesouro de Mormesk',
        motivo: alcance() ?? (livre ? null : (mormesk && salvo.mormeskVisto ? 'Mormesk o guarda' : null)),
        fazer: async () => {
          salvo.bauMago = true;
          guardar(c, 'moedaDeCobre', 1100); guardar(c, 'moedaDePrata', 160 + 250); guardar(c, 'diamante', 3);
          if (salvo.mormesk !== 'pago') guardar(c, 'cachimboDePlatina', 1);
          await painel(salvo.mormesk === 'pago' ? TEXTOS.bauMagoPago : TEXTOS.bauMago);
          app.refresh();
        },
      });
    }
    // O PAREDÃO da grande caverna (área 9): 3 m de elevação, que se sobe pela escada ou escalando (Atletismo CD 12). Quem falha por
    // 5 ou mais cai: 1d6 de pedra e fica caído, ao pé do paredão.
    const aqui = enc.field.heightAt(c.pos.x, c.pos.y);
    const la = enc.field.heightAt(tile.x, tile.y);
    if (naArea(tile, '9') && la - aqui >= 2 && distanceFt(c.pos, tile) <= 5 && !enc.field.blocksMove(tile.x, tile.y)) {
      ops.push({
        rotulo: 'Escalar o paredão', icone: 'acao-saltar', detalhe: 'Atletismo CD 12',
        motivo: enc.occupied(tile.x, tile.y, c) ? 'tem alguém lá em cima' : buscas.ja(c, 'escalar', tile),
        fazer: async () => {
          buscas.marcar(c, 'escalar', tile);
          const r = teste(c, 'atletismo', 12);
          if (r.passou) {
            c.pos = { ...c.pos, x: tile.x, y: tile.y };
            enc.say('acao', `${c.name} escala o paredão de pedra.`);
            app.refresh();
            await depoisDeMover(c);
            return;
          }
          if (r.total <= 12 - 5) {
            const dano = damageRoll(enc.rng, '1d6').total;
            enc.applyDamage(c, dano, 'concussão', null, {});
            addCondition(c, 'caido');
            await painel(TEXTOS.paredaoCai(c.name, dano), { teste: r });
          } else {
            await painel(TEXTOS.paredaoNaoSobe, { teste: r });
          }
          app.refresh();
        },
      });
    }
    // O lago escuro (área 10): o mago afogado no fundo.
    if (sup === 'aguaEscura' && naArea(tile, '10') && !salvo.lago) {
      ops.push({
        rotulo: 'Mergulhar e explorar o fundo', icone: 'acao-procurar', detalhe: 'Atletismo CD 10',
        motivo: longe(10) ?? buscas.ja(c, 'lago', tile),
        fazer: async () => {
          buscas.marcar(c, 'lago', tile);
          const r = teste(c, 'atletismo', 10);
          if (!r.passou) { await painel(TEXTOS.lagoFalha, { teste: r }); return; }
          salvo.lago = true;
          guardar(c, 'anelDePlatinaDoMago', 2);
          guardar(c, 'varinhaDeMisseisMagicos', 1);
          await painel(TEXTOS.lagoAcha, { teste: r });
          app.refresh();
        },
      });
    }
    // A fenda (área 18): as manoplas da anã soterrada, no fundo.
    if (sup === 'fosso' && naArea(tile, '18') && !salvo.manoplas) {
      ops.push({
        rotulo: 'Descer e vasculhar os escombros', icone: 'acao-procurar', detalhe: 'Percepção CD 20, uma vez por hora',
        motivo: longe(15) ?? buscas.ja(c, 'manoplas', tile),
        fazer: async () => {
          buscas.marcar(c, 'manoplas', tile);
          const r = teste(c, 'percepcao', 20);
          if (!r.passou) { await painel(TEXTOS.fendaFalha, { teste: r }); return; }
          salvo.manoplas = true;
          guardar(c, 'manoplasDeForcaDeOgro', 1);
          await painel(TEXTOS.fendaAcha, { teste: r });
          app.refresh();
        },
      });
    }
    // A saída: de volta à trilha. Depois de Nezznar, o fim da aventura.
    if ((ONDA_ECO.saida ?? []).some((e) => e.x === tile.x && e.y === tile.y)) {
      ops.push({
        rotulo: 'Voltar à trilha', icone: 'acao-disparada', detalhe: 'o mapa da região', motivo: longe(10),
        fazer: async () => {
          if (salvo.nezznar === 'preso' && !salvo.nezznarEntregue) await entregarNezznar();
          if (feitos.nezznarDerrotado && !salvo.fimContado) {
            salvo.fimContado = true;
            // O fecho do livro e quem saiu da mina. Marca a aventura como concluída: a região
            // segue aberta, mas o jogo sabe que a Mina Perdida foi achada.
            camp.aventuraConcluida = true;
            const grupoFinal = enc.combatants.filter((x) => x.side === 'party');
            await narrar(root, { formato: 'tela', paginas: paginasDoEpilogo({
              conclusao: TEXTOS.conclusao({ capturado: Boolean(feitos.nezznarCapturado), fugiu: Boolean(feitos.nezznarFugiu),
                gundren: Boolean(feitos.gundrenResgatado), nundro: Boolean(feitos.nundroResgatado) }),
              grupo: grupoFinal }) });
          }
          estado.encerrado = true;
          app.irParaRegiao(enc.combatants.filter((x) => x.side === 'party' && !x.dead), 'ondaEco');
        },
      });
    }
    return ops;
  }

  return {
    lugar: 'Caverna Onda Eco',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover,
    fimDoCombate,
    dialogoDe: (npc) => (estado.lutando ? null : arvoreDe(npc)),
    depoisDaConversa: resolver,
    // Só o depósito (7) e os aposentos do sacerdote, depois de Nezznar, são lugar de dormir: "nenhum monstro vem aqui".
    // Descansar é gastar tempo no mesmo lugar: a mina cobra (monstros vagando).
    depoisDoDescanso: async () => {
      // O veneno do gás dura dez minutos (o livro): um descanso o leva embora.
      for (const h of herois()) h.conditions = (h.conditions ?? []).filter((k) => !(k.id === 'envenenado' && k.source === 'gas'));
      if (estado.explorando && !herois().every((h) => naArea(h.pos, '7'))) await monstroVagando();
    },
    motivoSemDescanso: (tipo) => {
      if (!estado.explorando) return 'só fora da luta';
      if (tipo !== 'longo') return null;
      const seguro = herois().every((h) => naArea(h.pos, '7') || (salvo.templo === 'limpo' && naArea(h.pos, '20')));
      return seguro ? null : 'a mina está cheia de monstros: só o depósito desmoronado é seguro para dormir';
    },
    textoDoDescanso: () => ['Um descanso encostado numa parede de pedra lavrada, com o som das ondas ao longe.'],
    async iniciar() {
      prepararExploracao();
      await painel(TEXTOS.chegada);
      // Grupo abaixo do 5º nível: o livro avisa que a mina é para quem já passou por muita coisa.
      if (!salvo.avisoDeNivel && herois().reduce((s, h) => s + h.level, 0) / Math.max(1, herois().length) < 4.5) {
        salvo.avisoDeNivel = true;
        await painel(TEXTOS.avisoDeNivel);
      }
      // Nundro está preso nos aposentos do sacerdote (área 20): neutro, inconsciente, visível só pela porta aberta.
      if (!enc.combatants.includes(nundro)) { nundro.side = 'neutro'; nundro.facingVec = { dx: 0, dy: 1 }; enc.addCombatant(nundro); }
      // Quem o grupo já encontrou e deixou para trás (a conversa acabou em "sair" ou em acordo) volta ao seu lugar:
      // sem isso, ao sair e voltar não haveria mais como falar com eles, e a aventura não fecharia.
      if (mormesk && salvo.mormeskVisto && salvo.mormesk !== 'luta') entrarNeutro(mormesk, { dx: 0, dy: 1 });
      if (espectador && salvo.espectadorVisto && salvo.espectador !== 'luta') entrarNeutro(espectador, { dx: -1, dy: 0 });
      if (nezznar && salvo.temploVisto && salvo.templo !== 'luta') { entrarNeutro(nezznar, { dx: 1, dy: 0 }); posicionarRefem(); }
      app.refresh();
    },
  };
}
