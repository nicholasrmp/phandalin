// O REPOUSO DE ZORZULA, AS MINAS (o nível de baixo; capítulo 5 do Obelisco, Z12 a Z19). Mapa em `game/zorzula-mapas.js`,
// gerado por `src/dev/mapa-zorzula.py` sobre o battlemap da FA ("Zorzula's Rest – Mining Level").
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   Z12 a boca do elevador: três túneis; o poço sobe 9 m ao dormitório (o elevador, se consertado).
//   Z13 os vagonetes: seis vagonetes e três esqueletos de anão com o crânio afundado (cenário). Medicina ou Arcanismo
//       CD 16: marca de cérebro extraído por devorador de mente. Investigação 10: a propulsão é um cristal apagado, que
//       recarrega com um espaço de magia (ou uma lasca); recarregados, rodam no círculo do depósito, do penhasco e do
//       cristal. Investigação 15 num dos esqueletos: braceletes de celeridade.
//   Z14 a caverna de cristal: três gricks entre os cristais; na primeira entrada, cada herói faz Percepção CD 16, e
//       quem falha fica surpreso. Cada espiral de cristal tem CA 15 e 25 PV, revida (Destreza CD 16 ou 2d4 de energia em
//       quem a fere) e, quebrada, dá 1d6 lascas.
//   Z15 o penhasco: três ashenwights ferais e três psiônicos cavando a pedra. Os ferais só ficam hostis com quem os
//       ataca; os psiônicos, com Persuasão CD 15 ou 50 po em moedas ou gemas, apontam a ponte.
//   Z16 a fossa: um otyugh mutante. Furtividade CD 12 passa sem ser notado; Arcanismo CD 15 reconhece o bicho (com
//       vantagem para quem viu o do poço); Percepção passiva 14 vê o brilho na barriga: uma picareta luminosa.
//   Z17 o santuário de Ilsensine: Religião CD 17 reconhece; quem toca ou examina faz Carisma CD 20 ou fica
//       vulnerável a dano psíquico até tirarem a maldição; Investigação 15 acha um anel de escudo mental.
//   Z18 o depósito: a broca infernal ataca quem entra. Minério (sete lingotes de 25 po) e três caixotes lacrados
//       (Atletismo CD 12 cada): uma gema de brilho, quatro quartzos azuis, uma ametista grande. A esteira sobe à forja
//       se foi consertada lá em cima (Acrobacia 15; quem falha cai 3 m, 1d6).
//   Z19 a ponte e a fechadura psíquica: só dano psíquico a abre (CA 12, 30 PV); ferramentas de ladrão com Destreza
//       CD 18; ou um goblin psíquico convencido (Intimidação ou Persuasão CD 12). A plataforma sobe ao Santuário.
//
// DECISÕES NOSSAS, ditas:
//   - a surpresa dos gricks é por herói, pela Percepção ATIVA de cada um (o livro), não pela passiva do motor: quem
//     falha entra na lista de quem "dorme" na emboscada (`enc.dormindo`);
//   - a espiral de cristal é golpeada como as muralhas: um ataque de arma contra CA 15, explorando;
//   - a fechadura psíquica soma o dano das magias psíquicas preparadas de quem a ataca (Zombaria Viciosa, Sussurros
//     Dissonantes...); a arma não conta;
//   - o vagonete leva o grupo de uma parada à outra (depósito, penhasco, cristal) sem andar a linha.
//
// O estado mora em `app.campanha.obelisco5.zorzula` (o mesmo do posto).

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { d20, damageRoll } from '../core/dice.js';
import { rolarPericia, saveBonus, passivePerception, SKILL_NAME, skillBonus, abilityMod, proficiencyBonus } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { SPELLS } from '../rules/spells.js';
import { garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar, cobrar, totalEmCobre } from './comercio.js';
import { PONTOS_ZORZULA } from './zorzula-mapas.js';

const P = PONTOS_ZORZULA.ZORZULA_MINAS;
const MOVIMENTO = 60;
const SALA_DE = new Map();
for (const [id, cs] of Object.entries(P.salas)) for (const c of cs) SALA_DE.set(`${c.x},${c.y}`, id);
export const salaDasMinas = (p) => (p ? SALA_DE.get(`${p.x},${p.y}`) ?? null : null);
const em = (lista, t) => [].concat(lista ?? []).some((q) => q.x === t.x && q.y === t.y);

/** A fechadura psíquica (o livro): CA 12, 30 PV, imune a tudo menos psíquico. */
export const FECHADURA = { ca: 12, pv: 30 };
/** Cada espiral de cristal (o livro): CA 15, 25 PV, imune a veneno e psíquico. */
export const ESPIRAL = { ca: 15, pv: 25 };
/** As paradas do vagonete: o círculo do depósito, do penhasco e do cristal. */
const PARADAS = { deposito: { x: 25, y: 11, nome: 'o depósito' }, penhasco: { x: 11, y: 12, nome: 'o penhasco' }, cristal: { x: 8, y: 12, nome: 'a caverna de cristal' } };

export function criarZorzulaMinas(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const o5 = (camp.obelisco5 ??= { iniciado: true, cenas: {}, pistas: [], feito: {} });
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const z = (o5.zorzula ??= {});
  z.minas ??= {};
  const m = z.minas;
  m.buscas ??= {};
  m.cristais ??= {};
  const estado = { explorando: false, encerrado: false, lutando: null, qual: null };

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: 'As minas do Repouso de Zorzula', texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const teste = (c, pericia, cd, opcoes = {}) => {
    const r = rolarPericia(enc.rng, c, pericia, opcoes);
    return { nome: SKILL_NAME[pericia], total: r.total, passou: r.total >= cd };
  };
  const melhor = (pericia) => herois().reduce((a, h) => (!a || skillBonus(h, pericia) > skillBonus(a, pericia) ? h : a), null);
  const salvaguarda = (c, atributo, cd) => { const r = d20(enc.rng, saveBonus(c, atributo)); return { total: r.total, passou: r.total >= cd }; };
  const pista = (t) => { if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const jaFez = (chave, c) => ((m.buscas[chave] ??= []).includes(c.id) ? `${c.name} já tentou` : null);
  const marcar = (chave, c) => (m.buscas[chave] ??= []).push(c.id);
  const lasca = (c) => garantirInventario(c).bag.find((i) => i.id === 'lascaDeCristal' && i.qtd > 0);
  /** Recarregar um cristal (o livro): um espaço de magia de 1º círculo ou mais, ou uma lasca da caverna de cristal. */
  const comoRecarregar = (c) => {
    const slots = c.spellcasting?.slots ?? [];
    const espaco = slots.findIndex((n, i) => i >= 1 && n > 0);
    if (lasca(c)) return { motivo: null, gastar: () => { lasca(c).qtd -= 1; return 'uma lasca de cristal'; } };
    if (espaco >= 1) return { motivo: null, gastar: () => { slots[espaco] -= 1; return 'uma magia'; } };
    return { motivo: `${c.name} não tem espaço de magia nem lasca de cristal`, gastar: null };
  };

  // ------------------------------------------------------------- o elenco ----
  const letras = 'ABCDEF';
  const nasce = (tipo, pos, nome) => { const x = makeMonster(tipo, { x: pos.x, y: pos.y }); if (nome) x.name = nome; return x; };
  const gricks = m.cristal === 'limpo' ? [] : P.gricks.map((p, i) => nasce('grick', p, `Grick ${letras[i]}`));
  const ferais = m.penhasco === 'limpo' ? [] : P.ferais.map((p, i) => nasce('ashenwightFeral', p, `Ashenwight feral ${letras[i]}`));
  const psionicos = m.penhasco === 'limpo' ? [] : P.psionicos.map((p, i) => nasce('ashenwightPsionico', p, `Ashenwight psiônico ${letras[i]}`));
  const otyugh = m.fossa === 'limpa' ? null : nasce('otyughMutante', P.otyugh, 'Otyugh mutante');
  const broca = m.deposito === 'limpo' ? null : nasce('brocaInfernal', P.broca, 'Broca infernal');
  const neutro = (f, olha = { dx: 0, dy: 1 }) => { f.side = 'neutro'; f.facingVec = olha; if (!enc.combatants.includes(f)) enc.addCombatant(f); };

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.dormindo = null;
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
    estado.qual = null;
    root.classList.add('explorando');
    if (!herois().includes(app.selected)) app.select(herois()[0]);
    app.refresh();
  }

  function luta(qual, quem, { surpresos = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = quem;
    estado.qual = qual;
    root.classList.remove('explorando');
    // A SURPRESA POR HERÓI: quem falhou na própria Percepção entra como quem "dorme" na emboscada (o motor o põe
    // surpreso sem olhar a passiva); quem passou, com a furtividade 0, nunca é surpreendido.
    if (surpresos) {
      enc.emboscada = { emboscadores: 'foes', furtividade: [0] };
      enc.dormindo = (c) => surpresos.has(c.id);
    } else {
      enc.emboscada = null;
    }
    app.selected = null;
    enc.start();
    enc.dormindo = null;
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
  }

  // ------------------------------------------------- o que acorda cada sala ----
  async function cavernaDeCristal() {
    if (m.cristal || !gricks.length) return false;
    m.cristal = 'luta';
    const falharam = new Set();
    const linhas = [];
    for (const h of herois()) {
      const t = teste(h, 'percepcao', 16);
      if (!t.passou) falharam.add(h.id);
      linhas.push(`${h.name} (${t.nome} ${t.total}) ${t.passou ? 'vê os vultos entre os cristais a tempo' : 'só vê cristal'}.`);
    }
    await painel(['A caverna parece o lado de dentro de um geodo: espirais de cristal roxo saem do chão e das paredes, e um trilho desce em caracol pelo meio. Três dos "cristais" se mexem.', ...linhas],
      [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta('cristal', gricks.filter((f) => !f.dead), { surpresos: falharam });
    return true;
  }

  async function fossa() {
    if (m.fossa || !otyugh) return false;
    m.furtivos ??= [];
    const novos = herois().filter((h) => salaDasMinas(h.pos) === 'Z16' && !m.furtivos.includes(h.id));
    if (!novos.length) return false;
    // quem tem passiva 14 vê o brilho na barriga (uma vez)
    if (!m.picaretaVista && herois().some((h) => passivePerception(h) >= 14)) m.picaretaVista = true;
    for (const h of novos) {
      m.furtivos.push(h.id);
      const t = teste(h, 'furtividade', 12);
      if (t.passou) continue;
      m.fossa = 'luta';
      await painel([`${h.name} (${t.nome} ${t.total}) espirra água de esgoto.`, 'O que parecia uma pedra no meio da fossa abre um olho, depois outro. Uma boca cheia de dentes sobe da água, e tentáculos com espinhos atrás dela.',
        m.picaretaVista ? 'Pela pele quase transparente da barriga, alguma coisa brilha: um cabo de madeira e uma cabeça de cristal.' : null].filter(Boolean),
      [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      luta('fossa', [otyugh]);
      return true;
    }
    if (!m.fossaVista) {
      m.fossaVista = true;
      await painel('Uma caverna alagada de esgoto, com estalactites pingando. No meio, uma pedra grande e redonda. Vocês passam pela beira, devagar, e a pedra não se mexe.');
    }
    return false;
  }

  async function deposito() {
    if (m.deposito || !broca) return false;
    m.deposito = 'luta';
    await painel(['Uma caverna grande cheia de caixotes de minério, trilhos e escadas. No fundo, um ronco de ferro: uma broca do tamanho de uma carroça, cravejada de dentes e envolta em chamas, gira no lugar — e vira para vocês.'],
      [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta('deposito', [broca]);
    return true;
  }

  async function penhasco() {
    if (m.penhascoVisto || !ferais.length) return false;
    m.penhascoVisto = true;
    await painel(['Uma passarela de tábuas presa ao paredão, sobre a lava. Seis vultos cinzentos de anão batem picareta na pedra, como se ainda fosse um dia de trabalho. Três nem levantam a cabeça. Três outros param e olham para vocês, com olhos que brilham.']);
    return false;
  }

  async function depoisDoPasso() {
    if (!estado.explorando) return;
    const salas = new Set(herois().map((h) => salaDasMinas(h.pos)));
    if (salas.has('Z14') && await cavernaDeCristal()) return;
    if (salas.has('Z16') && await fossa()) return;
    if (salas.has('Z18') && await deposito()) return;
    if (salas.has('Z15')) await penhasco();
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const qual = estado.qual;
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O Repouso de Zorzula', texto: ['No escuro das minas, o silêncio volta, e só a lava continua borbulhando.'] }] });
      app.encerrarPartida();
      return;
    }
    if (qual === 'cristal') { m.cristal = 'limpo'; await painel('Os gricks param de se mexer, e os cristais voltam a ser só cristais.'); await darXpDe(lutou, 'Os gricks da caverna de cristal'); }
    if (qual === 'fossa') {
      m.fossa = 'limpa';
      await painel(m.picaretaVista ? 'O otyugh afunda no esgoto. A barriga translúcida ainda brilha por dentro.' : 'O otyugh afunda no esgoto, e a fossa fica quieta.');
      await darXpDe(lutou, 'O otyugh mutante');
    }
    if (qual === 'deposito') { m.deposito = 'limpo'; await painel('A broca para de girar, e as chamas dela se apagam com um chiado.'); await darXpDe(lutou, 'A broca infernal'); }
    if (qual === 'penhasco') { m.penhasco = 'limpo'; await painel('Os seis vultos se desfazem em cinza sobre as tábuas.'); await darXpDe(lutou, 'Os ashenwights do penhasco'); }
    prepararExploracao();
  }

  // -------------------------------------------------- golpear um objeto ----
  /** Um ataque de arma de quem está perto, contra a CA do objeto: devolve o dano (0 se errou). */
  function golpear(c, ca) {
    const forca = abilityMod(c.abilities?.str ?? 10);
    const destreza = abilityMod(c.abilities?.dex ?? 10);
    const mod = Math.max(forca, destreza);
    const r = d20(enc.rng, mod + proficiencyBonus(c.level ?? 1));
    if (r.total < ca) return { acertou: false, total: r.total, dano: 0 };
    return { acertou: true, total: r.total, dano: Math.max(1, damageRoll(enc.rng, '1d8').total + mod) };
  }
  /** As magias de dano psíquico que o herói tem prontas (a fechadura só aceita esse dano). */
  const magiasPsiquicas = (c) => [...new Set([...(c.spellcasting?.prepared ?? []), ...(c.spellcasting?.cantrips ?? []), ...(c.spellcasting?.known ?? [])])]
    .map((id) => ({ id, s: SPELLS[id] })).filter((x) => x.s?.damageType === 'psíquico');

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const aqui = (p) => p && tile.x === p.x && tile.y === p.y;
    const sala = salaDasMinas(tile);

    // O ELEVADOR, de volta ao dormitório
    if (aqui(P.elevador)) {
      ops.push({ rotulo: 'Subir pelo elevador', icone: 'acao-disparada', detalhe: z.elevador ? 'ao dormitório' : 'o elevador está quebrado', motivo: longe(c, tile) ?? (z.elevador ? null : 'o mecanismo lá de cima não foi consertado'),
        fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'zorzulaPosto', continuarCom: v, chegada: 'elevador' })) });
    }
    // OS ESQUELETOS (Z13)
    if (em(P.esqueletos, tile)) {
      if (!m.esqueletosLidos) {
        ops.push({ rotulo: 'Examinar os crânios', icone: 'acao-procurar', detalhe: 'Medicina ou Arcanismo, CD 16', motivo: longe(c, tile) ?? jaFez('cranios', c), fazer: async () => {
          marcar('cranios', c);
          const pericia = skillBonus(c, 'medicina') >= skillBonus(c, 'arcanismo') ? 'medicina' : 'arcanismo';
          const t = teste(c, pericia, 16);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) vê três anões mortos há muito tempo, de crânio afundado. Golpe de maça, talvez.`); return; }
          m.esqueletosLidos = true;
          pista('Os anões das minas morreram de cérebro arrancado: marca de devorador de mente.');
          await painel(`${c.name} (${t.nome} ${t.total}) olha de perto e engole em seco: os crânios não foram afundados de fora. Foram abertos, e o que havia dentro foi tirado. É o que um devorador de mente faz.`);
        } });
      }
      if (!m.braceletes) {
        ops.push({ rotulo: 'Revistar os esqueletos', icone: 'acao-procurar', detalhe: 'Investigação CD 15', motivo: longe(c, tile) ?? jaFez('esqueletos', c), fazer: async () => {
          marcar('esqueletos', c);
          const t = teste(c, 'investigacao', 15);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) acha os bolsos já revirados por alguém, há muito tempo.`); return; }
          m.braceletes = true;
          guardar(c, 'braceletesDeCeleridade', 1);
          await painel(`${c.name} (${t.nome} ${t.total}) acha, ainda presos aos ossos de um braço, um par de braceletes de couro com placas de bronze. Quem saqueou os bolsos não olhou os pulsos.`);
          app.refresh();
        } });
      }
    }
    // OS VAGONETES (Z13): o cristal, e depois a viagem
    if (em(P.vagonetes, tile)) {
      if (!m.vagonetesVistos) {
        ops.push({ rotulo: 'Examinar o vagonete', icone: 'acao-procurar', detalhe: 'Investigação CD 10', motivo: longe(c, tile), fazer: async () => {
          const t = teste(c, 'investigacao', 10);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) vê um vagonete enferrujado de rodas tortas.`); return; }
          m.vagonetesVistos = true;
          await painel(`${c.name} (${t.nome} ${t.total}) acha, embaixo do vagonete, um cristal apagado preso ao eixo, igual ao do elevador. Era ele que fazia o vagonete andar sozinho.`);
          app.refresh();
        } });
      } else if (!m.vagonetes) {
        const rec = comoRecarregar(c);
        ops.push({ rotulo: 'Recarregar os vagonetes', icone: 'acao-usarObjeto', detalhe: 'um espaço de magia ou uma lasca', motivo: longe(c, tile) ?? rec.motivo, fazer: async () => {
          const com = rec.gastar();
          m.vagonetes = true;
          await painel(`${c.name} toca o cristal com ${com}. Os vagonetes estalam, as rodas tortas giram, e um deles anda sozinho até a chave de desvio e espera.`);
          app.refresh();
        } });
      }
    }
    if (m.vagonetes && (em(P.vagonetes, tile) || Object.values(PARADAS).some((p) => aqui(p)))) {
      ops.push({ rotulo: 'Andar de vagonete', icone: 'acao-disparada', detalhe: 'o depósito, o penhasco, o cristal', motivo: longe(c, tile), fazer: async () => {
        const para = await painel('Para onde?', [...Object.entries(PARADAS).map(([k, p]) => ({ rotulo: p.nome, valor: k })), { rotulo: 'Ficar', valor: 'nada' }]);
        const p = PARADAS[para];
        if (!p) return;
        for (const h of herois()) h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(p) ?? p) };
        await painel(`Os vagonetes rangem pelo trilho escuro, ganham velocidade numa descida e diminuem a marcha em ${p.nome}. Vocês pulam fora.`);
        app.refresh();
        await depoisDoPasso();
      } });
    }
    // AS ESPIRAIS DE CRISTAL (Z14)
    if (em(P.cristais, tile)) {
      const k = `${tile.x},${tile.y}`;
      const esp = (m.cristais[k] ??= { pv: ESPIRAL.pv });
      if (esp.pv > 0) {
        ops.push({ rotulo: 'Quebrar a espiral de cristal', icone: 'acao-atacar', detalhe: `CA ${ESPIRAL.ca}, ${esp.pv} PV · ela revida`, motivo: longe(c, tile), fazer: async () => {
          const g = golpear(c, ESPIRAL.ca);
          if (!g.acertou) { await painel(`${c.name} (${g.total}) bate de raspão: o cristal nem lasca.`); return; }
          esp.pv = Math.max(0, esp.pv - g.dano);
          const s = salvaguarda(c, 'dex', 16);
          const linhas = [`${c.name} acerta (${g.total}): ${g.dano} de dano na espiral.`];
          if (!s.passou) {
            const dano = damageRoll(enc.rng, '2d4').total;
            enc.applyDamage(c, dano, 'energético', null, { magico: true });
            linhas.push(`O cristal revida com um estalo de luz (Destreza ${s.total}): ${dano} de dano energético.`);
          } else linhas.push(`O cristal estala de volta, e ${c.name} (Destreza ${s.total}) desvia.`);
          if (esp.pv <= 0) {
            const n = damageRoll(enc.rng, '1d6').total;
            guardar(c, 'lascaDeCristal', n);
            linhas.push(`A espiral se parte em ${n} lasca${n > 1 ? 's' : ''} que zumbem na mão.`);
          }
          await painel(linhas);
          app.refresh();
        } });
      }
    }
    // O PENHASCO (Z15): os psiônicos apontam a ponte por conversa ou por 50 po
    if (sala === 'Z15' && psionicos.some((p) => !p.dead) && !m.ponteApontada && m.penhasco !== 'luta') {
      const ps = psionicos.find((p) => !p.dead);
      if (distanceFt(c.pos, ps.pos) <= 15 || tile.x === ps.pos.x && tile.y === ps.pos.y) {
        ops.push({ rotulo: 'Falar com os anões que olham', icone: 'acao-procurar', fazer: () => falarComOsPsionicos(c) });
      }
    }
    if (sala === 'Z15' && m.penhasco !== 'limpo' && m.penhasco !== 'luta' && [...ferais, ...psionicos].some((f) => !f.dead && f.pos.x === tile.x && f.pos.y === tile.y)) {
      ops.push({ rotulo: 'Atacar os mineiros mortos', icone: 'acao-atacar', fazer: () => { m.penhasco = 'luta'; luta('penhasco', [...ferais, ...psionicos].filter((f) => !f.dead)); } });
    }
    // A FOSSA (Z16): reconhecer o bicho; e, morto, tirar a picareta
    if (sala === 'Z16' && otyugh && !m.otyughLido) {
      ops.push({ rotulo: 'Lembrar o que é aquilo', icone: 'acao-procurar', detalhe: 'Arcanismo CD 15', motivo: jaFez('otyugh', c), fazer: async () => {
        marcar('otyugh', c);
        const t = teste(c, 'arcanismo', 15, o5.feito?.viuOtyugh ? { advantage: true } : {});
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) não reconhece a coisa.`); return; }
        m.otyughLido = true;
        await painel(`${c.name} (${t.nome} ${t.total}) reconhece um otyugh — ${o5.feito?.viuOtyugh ? 'como o do poço da Barthen, mas torto, cheio de cascas e com um hálito que se vê' : 'um comedor de lixo'}. Fica no esgoto e ataca o que chega perto e faz barulho.`);
      } });
    }
    if (otyugh?.dead && m.picaretaVista && !m.picareta && distanceFt(tile, otyugh.pos) <= 5) {
      ops.push({ rotulo: 'Tirar a picareta da barriga', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
        m.picareta = true;
        guardar(c, 'picaretaLuminosa', 1);
        await painel(`${c.name} enfia o braço onde ninguém queria enfiar e puxa: uma picareta de guerra de cabeça de cristal, limpa como nova. Ela acende sozinha na mão.`);
        app.refresh();
      } });
    }
    // O SANTUÁRIO DE ILSENSINE (Z17)
    if (aqui(P.pedestal) || (sala === 'Z17' && tile.x === P.pedestal.x + 1 && tile.y === P.pedestal.y)) {
      ops.push({ rotulo: 'Examinar o santuário', icone: 'acao-procurar', detalhe: 'Religião CD 17 · algo ruim mora aqui', motivo: longe(c, tile), fazer: () => examinarSantuario(c) });
      if (!m.anel) {
        ops.push({ rotulo: 'Revirar as oferendas', icone: 'acao-procurar', detalhe: 'Investigação CD 15', motivo: longe(c, tile) ?? jaFez('anel', c), fazer: async () => {
          marcar('anel', c);
          await tocar(c);
          const t = teste(c, 'investigacao', 15);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) acha pó e um cheiro de coisa podre.`); return; }
          m.anel = true;
          guardar(c, 'anelDeEscudoMental', 1);
          await painel(`${c.name} (${t.nome} ${t.total}) acha, entre os cacos da base, um anel fino de prata escurecida: uma oferenda antiga, deixada aqui antes de tudo.`);
          app.refresh();
        } });
      }
    }
    // O DEPÓSITO (Z18): o minério e os três caixotes lacrados
    if (sala === 'Z18' && m.deposito === 'limpo' && !m.minerio) {
      ops.push({ rotulo: 'Encher um saco de minério', icone: 'acao-procurar', fazer: async () => {
        m.minerio = true;
        guardar(c, 'minerioDeFerro', 1);
        await painel('Uns quinze quilos do melhor minério das pilhas. O ferreiro de Phandalin tira sete lingotes disto.');
        app.refresh();
      } });
    }
    const caixa = P.caixotes.findIndex((q) => aqui(q));
    if (caixa >= 0 && !(m.caixotes ??= []).includes(caixa)) {
      ops.push({ rotulo: 'Arrombar o caixote lacrado', icone: 'acao-empurrar', detalhe: 'Atletismo CD 12', motivo: longe(c, tile), fazer: async () => {
        const t = teste(c, 'atletismo', 12);
        if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) puxa a tampa, e os pregos aguentam.`); return; }
        m.caixotes.push(caixa);
        const dentro = [['gemaDeBrilho', 1, 'uma gema que acende sozinha quando alguém a olha: uma gema de brilho'], ['quartzoAzul', 4, 'quatro quartzos azuis enrolados em palha'], ['ametistaGrande', 1, 'uma ametista grande, cor de vinho']][caixa];
        guardar(c, dentro[0], dentro[1]);
        await painel(`${c.name} (${t.nome} ${t.total}) arranca a tampa. Dentro, ${dentro[2]}.`);
        app.refresh();
      } });
    }
    // A ESTEIRA (Z18): sobe à forja, se foi consertada lá em cima
    if (aqui(P.esteira)) {
      ops.push({ rotulo: 'Montar nos baldes da esteira', icone: 'acao-disparada', detalhe: z.esteira ? 'Acrobacia CD 15 · sobe à forja' : 'a esteira está parada', motivo: longe(c, tile) ?? (z.esteira ? null : 'o mecanismo dela, na forja, não foi consertado'), fazer: () => subirPelaEsteira(c) });
    }
    // A FECHADURA PSÍQUICA (Z19)
    if (aqui(P.fechadura)) {
      if (!m.fechaduraAberta) {
        m.fechaduraPv ??= FECHADURA.pv;
        for (const mg of magiasPsiquicas(c)) {
          ops.push({ rotulo: `Ferir a fechadura com ${mg.s.name ?? mg.id}`, icone: 'acao-atacar', detalhe: `${m.fechaduraPv} PV · só dano psíquico`, motivo: longe(c, tile, 60) ?? (mg.s.level > 0 && !(c.spellcasting?.slots ?? []).some((n, i) => i >= mg.s.level && n > 0) ? 'sem espaço de magia' : null), fazer: async () => {
            if (mg.s.level > 0) { const sl = c.spellcasting.slots; sl[sl.findIndex((n, i) => i >= mg.s.level && n > 0)] -= 1; }
            const dano = damageRoll(enc.rng, mg.s.damage ?? '1d6').total;
            m.fechaduraPv = Math.max(0, m.fechaduraPv - dano);
            await painel(m.fechaduraPv > 0
              ? `${c.name} solta ${mg.s.name ?? mg.id} contra a porta: ${dano} de dano psíquico. Os canais verdes brilham mais forte (faltam ${m.fechaduraPv}).`
              : `${c.name} solta ${mg.s.name ?? mg.id}: ${dano} de dano psíquico, e os canais verdes acendem inteiros. A porta dupla se abre com um suspiro de ar quente.`);
            if (m.fechaduraPv <= 0) abrirAPorta();
            app.refresh();
          } });
        }
        ops.push({ rotulo: 'Forçar a fechadura', icone: 'acao-usarObjeto', detalhe: 'ferramentas de ladrão · Destreza CD 18', motivo: longe(c, tile) ?? (garantirInventario(c).bag.some((i) => i.id === 'ferramentasDeLadrao' && i.qtd > 0) ? jaFez('fechadura', c) : `${c.name} não tem ferramentas de ladrão`), fazer: async () => {
          marcar('fechadura', c);
          const t = teste(c, 'prestidigitacao', 18);
          if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) mexe nos canais por um bom tempo. Nada.`); return; }
          abrirAPorta();
          await painel(`${c.name} (${t.nome} ${t.total}) acha um caminho por dentro dos canais e engana o mecanismo: a porta se abre.`);
        } });
        if (z.trato || z.dormitorio === 'quietos') {
          ops.push({ rotulo: 'Trazer um goblin psíquico para abrir', icone: 'acao-procurar', detalhe: 'Intimidação ou Persuasão CD 12', motivo: jaFez('goblin', c), fazer: async () => {
            marcar('goblin', c);
            const pericia = skillBonus(c, 'intimidacao') >= skillBonus(c, 'persuasao') ? 'intimidacao' : 'persuasao';
            const t = teste(c, pericia, 12);
            if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) não convence nenhum goblin do trato a descer até a ponte.`); return; }
            abrirAPorta();
            await painel(`${c.name} (${t.nome} ${t.total}) volta com um goblin de olhos acesos, que olha a porta, estala os dedos e bate nela com a cabeça — sem encostar. Os canais acendem, um a um, e a porta abre. Ele vai embora contando vantagem.`);
          } });
        }
      } else {
        ops.push({ rotulo: 'Subir pela plataforma', icone: 'acao-disparada', detalhe: 'ao Santuário Índigo', motivo: longe(c, tile), fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'santuarioIndigo', continuarCom: v })) });
      }
    }
    return ops;
  }

  function abrirAPorta() {
    m.fechaduraAberta = true;
    m.fechaduraPv = 0;
    app.refresh();
  }

  async function falarComOsPsionicos(c) {
    const pode50 = totalEmCobre(todos()) >= 5000;
    const r = await painel('Um dos anões cinzentos larga a picareta e fala com uma voz de pedra raspando: — Vivos. Faz tempo. O que procuram aqui embaixo?', [
      { rotulo: 'Perguntar pelo goblin de cabeça grande (Persuasão, CD 15)', valor: 'persuasao', primaria: true },
      ...(pode50 ? [{ rotulo: 'Oferecer 50 po', valor: 'ouro' }] : []),
      { rotulo: 'Deixar para lá', valor: 'nada' },
    ]);
    if (r === 'nada') return;
    if (r === 'ouro') cobrar(todos(), 5000);
    else {
      const t = teste(c, 'persuasao', 15);
      if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) não arranca nada. O anão volta a cavar, e não olha mais.`); m.ponteApontada = 'recusou'; return; }
    }
    m.ponteApontada = true;
    pista('Os mineiros mortos do penhasco viram o Ruxithid passar muitas vezes pela ponte de pedra sobre a lava, até a pirâmide.');
    await painel(`${r === 'ouro' ? 'O anão olha as moedas por um tempo comprido, como quem se lembra do que elas compravam, e as guarda.' : 'O anão pensa um tempo comprido.'} — O de cabeça grande. Passa sempre pela ponte, até a pirâmide. Lá dentro, sobe. Nunca desce do mesmo jeito que subiu. — Ele volta a cavar.`);
  }

  async function tocar(c) {
    m.tocaram ??= [];
    if (m.tocaram.includes(c.id)) return;
    m.tocaram.push(c.id);
    const s = salvaguarda(c, 'cha', 20);
    if (s.passou) { enc.say('acao', `${c.name} sente uma pressão atrás dos olhos, e ela passa (Carisma ${s.total}).`); return; }
    (c.vulnerable ??= []).includes('psíquico') || c.vulnerable.push('psíquico');
    c.malditoPorIlsensine = true;
    await painel(`${c.name} (Carisma ${s.total}) sente uma dor de cabeça que não passa, e cada vez que pisca vê tentáculos escuros no canto do olho. Até uma magia tirar isso, a mente dele está aberta: vulnerável a dano psíquico.`);
  }

  async function examinarSantuario(c) {
    await tocar(c);
    if (m.santuarioLido) { await painel('A estátua do anão herói, sem cabeça, com um símbolo que não é anão pintado na base.'); return; }
    const t = teste(c, 'religiao', 17);
    if (!t.passou) { await painel(`${c.name} (${t.nome} ${t.total}) vê uma estátua quebrada de anão herói, com a cabeça no chão, um símbolo estranho na base e manchas de um líquido escuro.`); return; }
    m.santuarioLido = true;
    pista('O santuário quebrado das minas é de Ilsensine, o deus dos devoradores de mente; quem o destruiu foi o Ruxithid, por uma vontade que nem os goblins entendem.');
    await painel(`${c.name} (${t.nome} ${t.total}) reconhece o símbolo: Ilsensine, o deus dos devoradores de mente, pintado por cima de uma estátua duergar. E alguém o profanou há pouco — os goblins, pelo jeito. Gente que odeia Ilsensine sem saber por quê: alguém mais está mandando neles.`);
  }

  async function subirPelaEsteira(c) {
    const t = teste(c, 'acrobacia', 15);
    if (!t.passou) {
      const dano = damageRoll(enc.rng, '1d6').total;
      enc.applyDamage(c, dano, 'concussão', null, {});
      await painel(`${c.name} (${t.nome} ${t.total}) se pendura num balde, perde o apoio a três metros do chão e cai (${dano} de dano).`);
      app.refresh();
      return;
    }
    await painel(`${c.name} (${t.nome} ${t.total}) pula num balde, e os outros vêm atrás, um a um. A esteira sobe pelo buraco do teto, no escuro, e despeja vocês, sujos de minério, na forja lá em cima.`);
    sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'zorzulaPosto', continuarCom: v, chegada: 'esteira' }));
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(todos());
  }

  return {
    lugar: 'As minas do Repouso de Zorzula',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso();
    },
    fimDoCombate,
    evento() {},
    dialogoDe: () => null,
    elenco: { gricks, ferais, psionicos, otyugh, broca },
    async iniciar() {
      for (const f of [...gricks, ...ferais, ...psionicos, otyugh, broca].filter(Boolean)) neutro(f);
      // de onde o grupo chega: o elevador (padrão), a esteira (no depósito) ou a plataforma da pirâmide (na ponte)
      const chegada = config.chegada === 'esteira' ? P.chegadaEsteira : config.chegada === 'plataforma' ? P.chegadaPlataforma : null;
      if (chegada) for (const [i, h] of todos().entries()) h.pos = { ...h.pos, ...(enc.casaLivreMaisProxima(chegada[i] ?? chegada[0]) ?? chegada[0]) };
      if (!m.vistas) {
        m.vistas = true;
        await painel('Terra batida e sedimento, túneis baixos e retos, e um escuro que a luz de vocês mal empurra. Lá longe, um brilho azul e um calor de forno: a lava.');
      }
      prepararExploracao();
      await depoisDoPasso();
    },
  };
}
