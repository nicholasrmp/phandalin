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
import { distanceFt, ARESTA, GLIFOS, SUPERFICIES } from '../core/grid.js';
import { d20, damageRoll } from '../core/dice.js';
import { skillBonus, passivePerception, saveBonus, SKILL_NAME } from '../rules/abilities.js';
import { addCondition } from '../rules/conditions.js';
import { criarBuscas } from './buscas.js';
import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { itemDeId } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { ONDA_ECO } from './ondaeco.js';
import { guardar } from './comercio.js';
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
    luta(esqueletos.filter((f) => !f.dead));
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
    luta([...bugbearsFenda, ...vhalak].filter((f) => !f.dead));
  }

  // O GÁS DOS FUNGOS (área 8): quem atravessa a caverna solta o gás do tapete. Salvaguarda de Constituição
  // CD 11 de todos que estão lá; falhou, 3d6 de veneno e envenenado por dez minutos. O gás some em um minuto, e
  // quem termina o turno lá dentro repete — aqui, a cada quatro passos dentro da caverna.
  async function gasDosFungos(entrou) {
    const dentro = herois().filter((h) => naArea(h.pos, '8'));
    if (!dentro.length) { salvo.gas = {}; return; }
    for (const h of dentro) {
      salvo.gas[h.id] = (salvo.gas[h.id] ?? -1) + 1;
      if (!(entrou && salvo.gas[h.id] === 0) && salvo.gas[h.id] % 4 !== 0) continue;
    }
    const alvos = dentro.filter((h) => salvo.gas[h.id] % 4 === 0);
    if (!alvos.length) return;
    const falharam = [];
    for (const h of alvos) {
      const s = salvaguarda(h, 'con', 11);
      if (s.passou) continue;
      const dano = damageRoll(enc.rng, '3d6');
      enc.applyDamage(h, dano.total, 'veneno', null, {});
      addCondition(h, 'envenenado', { rounds: 100 });
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
    if (espectador && npc === espectador) return arvoreDoEspectador();
    if (nezznar && npc === nezznar) return arvoreDeNezznar();
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
      if (fim === 'luta') iniciarTemplo();
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
  const conversaDeNezznar = async () => { salvo.temploVisto = true; await conversaDe(nezznar, { dx: 1, dy: 0 }); };
  // A luta final: Nezznar, os dois bugbears da mesa e as quatro aranhas (que se escondem atrás dos pilares).
  function iniciarTemplo() {
    salvo.templo = 'luta';
    const furt = furtividadeDe(aranhasTemplo);
    const reforco = [...bugbearsFenda, ...vhalak].filter((f) => !f.dead);
    if (reforco.length) prepararReforcos({ 3: { bando: reforco, aviso: 'Do corredor chegam passos pesados: o que sobrou da caverna desmoronada ouviu a luta.' } });
    luta([nezznar, ...bugbearsTemplo, ...aranhasTemplo].filter((f) => !f.dead), { furt });
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
    const volta = [];
    for (let k = 0; k < 400 && volta.length < quantos; k += 1) {
      const x = centro.x + Math.round((enc.rng() - 0.5) * 16);
      const y = centro.y + Math.round((enc.rng() - 0.5) * 16);
      if (!enc.field.inside(x, y) || enc.field.blocksMove(x, y) || Math.abs(x - centro.x) + Math.abs(y - centro.y) < 5) continue;
      if (areaDe({ x, y }) === null || volta.some((v) => v.x === x && v.y === y)) continue;
      if ((tipo === 'gelatinaOcre') && enc.field.paredeNaPegada?.(x, y, 2)) continue;
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
    const aqui = (id) => herois().some((h) => naArea(h.pos, id));
    // AS ONDAS ESTRONDOSAS: de tempos em tempos o estrondo chega pela pedra, mais forte para o nordeste.
    salvo.passos = (salvo.passos ?? 0) + 1;
    if (salvo.passos % 30 === 0) enc.say('acao', c.pos.x > 48 && c.pos.y < 30 ? TEXTOS.ondaPerto : TEXTOS.ondaLonge);
    if (aqui('8')) { await gasDosFungos(!salvo.gasEntrou); salvo.gasEntrou = true; } else if (salvo.gasEntrou) { salvo.gasEntrou = false; salvo.gas = {}; }
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
    const dos = (lista) => todos.some((f) => lista.includes(f));
    const total = (lista) => valeDoBando([...new Set([...lista, ...reforcos.filter((f) => f.dead)])].filter((f) => f.dead));
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
      for (const b of BANDOS) {
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

  // A QUEDA DE NEZZNAR: o que ele carregava, e o que a aventura fecha.
  async function fimDoTemplo() {
    const quem = herois()[0];
    if (quem) {
      guardar(quem, 'pocaoDeCura', 1);
      guardar(quem, 'cajadoAranha', 1);
      guardar(quem, 'chaveDoAranhaNegra', 1);
    }
    feitos.nezznarDerrotado = true;
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
          motivo: longe(5) ?? buscas.ja(c, `porta-${t.id}`, ca),
          fazer: async () => {
            buscas.marcar(c, `porta-${t.id}`, ca);
            const r = teste(c, t.pericia, t.cd);
            if (!r.passou) { await painel(TEXTOS.portaResiste, { teste: r }); return; }
            abrirTranca(t);
            await painel(t.texto, { teste: r });
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
      });
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
          guardar(c, 'dragonguard', 1);
          feitos.temLightbringer = true;
          await painel(TEXTOS.itensForja);
          app.refresh();
        },
      });
    }
    if (v === 'estante' && naArea(tile, '14') && !salvo.mapaMormesk) {
      lin('Procurar o mapa nos tomos', 'investigacao', 12, 'tomosMormesk', async (r) => {
        const livre = ['pago', 'morto'].includes(salvo.mormesk);
        if (!livre) { await painel(TEXTOS.mormeskVigia); return; }
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
          if (feitos.nezznarDerrotado && !salvo.fimContado) {
            salvo.fimContado = true;
            await narrar(root, { formato: 'tela', paginas: [{ titulo: 'A Mina Perdida', texto: TEXTOS.conclusao }] });
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
    depoisDoDescanso: async () => { if (estado.explorando && !herois().every((h) => naArea(h.pos, '7'))) await monstroVagando(); },
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
      // Nundro está preso nos aposentos do sacerdote (área 20): neutro, inconsciente, visível só pela porta aberta.
      if (!enc.combatants.includes(nundro)) { nundro.side = 'neutro'; nundro.facingVec = { dx: 0, dy: 1 }; enc.addCombatant(nundro); }
      app.refresh();
    },
  };
}
