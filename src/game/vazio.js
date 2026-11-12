// O VAZIO SEM FIM (o Obelisco, capítulo 8): o nada colorido no coração do domínio de Ilvaash, onde ilhas arrancadas de
// outros mundos flutuam. As oito, sobre os battlemaps da FA (`vazio-mapas.js`, de `src/dev/mapa-vazio.py`), a oitava sendo
// a Ânima de Ilvaash, onde os fanáticos remendam o obelisco.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - NO VAZIO TODO MUNDO VOA com o deslocamento a pé, e paira; a luz é plena; o ar cheira a metal queimado;
//   - A VIAGEM: a cada chegada numa ilha, rola-se d8 duas vezes para as duas ilhas à vista (a atual rola de novo; o 8, a
//     Ânima, também, enquanto o grupo não visitou cinco outras; repetida, só uma à vista); o descanso longo rola de novo.
//     Descansar no Reino Distante cobra Sabedoria CD 15, ou um nível de exaustão. Quem sai do grupo é o grupo inteiro: a
//     viagem não se faz em pedaços;
//   - A CÚPULA DE CRISTAL (onde se chega pelo furo da Poça): cinco guardiões-escudo dentro da cúpula guardam quatro presos
//     colados na parede com muco (Atletismo CD 12, uma ação, solta um); soltos, contam dos fanáticos, dos cinco levados à
//     ilha da estátua e de quantos pedaços de pedra os fanáticos carregavam;
//   - A PONTE VAZIA: o rio escuro com o aboleth e o elemental da água, que atacam quem chega perto; o SÍMBOLO no meio da
//     ponte (Carisma CD 19: cego e desesperançado por um minuto; Investigação CD 19 o acha); na torre, o mago sem cabeça,
//     o diário que descreve as ilhas e os tesouros;
//   - O CHARCO DA DÚVIDA: as duas nagas espirituais, que chamam uma à outra pelo ardil (a charada sem resposta do Valsyx,
//     a cobra verdadeira da Charnyz) e renascem dias depois; o pergaminho e as nove opalas;
//   - O NEMATÓDEO: a boca que se fecha quando alguém chega perto da tenda (Destreza CD 20 ou é empurrado para a garganta),
//     as duas armadilhas de intelecto que saem dela, a MEMBRANA (o furo certo abre a boca; rasgá-la toda faz o bicho
//     vomitar ácido, Constituição CD 18, 12d10, e quem cai a 0 PV assim se dissolve) e o lago de ácido do estômago;
//   - O MIASMA OCLUDENTE: névoa mortal em tudo (5d8 de veneno no começo do turno, Constituição CD 17, metade se passar), a
//     língua de metal na ilhota do meio, e os três perseguidores invisíveis que a guardam e caçam quem a leva, de ilha em
//     ilha. Eles não enxergam pela névoa: pegada a língua, saem da ilhota e atacam o ladrão na ilha seguinte. A travessia
//     da nuvem até a ilhota, na chegada e na saída, custa duas rodadas de névoa (decisão nossa: a nuvem tem 30 m de raio,
//     o mapa da FA é ela inteira, e voando a 18 m por turno são duas);
//   - A ESTÁTUA TOMBADA: a língua de metal na boca da estátua abre a base, e os quatro presos de dentro contam o plano;
//   - O CAMPO DE BATALHA LAMENTOSO: as patrulhas de mezzoloths, a pirâmide (três mezzoloths e o brutamonte, que se
//     espalham se ouvirem que a Nellik morreu), e o moinho da Nellik, que conversa, e o Frevvik, que toca a trompa;
//   - A ÂNIMA DE ILVAASH: só à vista depois de cinco outras ilhas; quem voa até ela é puxado para a plataforma de chegada.
//     Os três fanáticos (Chishinix com a cabeça cortada, Hashutu, que vê às cegas, e Voalsh, que só voa) ficam onde o
//     número de pedaços manda (4: A1, A2 e A4; 5: A1 e A4; 6 ou 7: todos em A4), e com 7 os dois profetas guardam A3. A
//     Chishinix conversa para ganhar tempo, pede os pedaços que o grupo trouxer, avisa os outros pela mente e ataca;
//     abaixo de 30 PV recua para junto deles. O OBELISCO no estrado não tem PV: o dano nele vai para o fanático mais perto
//     (`combat.js contragolpeDoObelisco`), em dobro se o grupo pegou um fragmento no capítulo 6, e depois do primeiro os
//     fanáticos brigam para não ser o mais perto (`ai.js pararPertoDoObelisco`). As tabuletas do altar de A3 (Arcanismo
//     ou Investigação, CD 16) contam a fraqueza. Mortos os três, o obelisco vira pó e sobe o 12º nível;
//
// E O QUE ENTROU DEPOIS (2026-11-12): a ESPERA de 1d6 dias por uma ilha que sumiu (cada dia, um descanso com o teste de
// Sabedoria, `esperarIlha`); a FUMAÇA do Campo, que é a penumbra da grade de luz, menos a até 9 m do moinho enquanto duas
// das três PÁS girarem, e as pás, objetos de CA 13 e 30 PV que se quebram como trecho de muralha (`montarMoinho`).
//
// DE FORA, dito: o "Bound" dos guardiões-escudo (o livro diz que eles não têm amuleto nem dono aqui, e o traço só vale
// com o dono). A ALTURA da Ânima entrou (`alturasDaAnima`: cobertura e visão; ninguém paga subida, porque todos voam) e
// o ARDIL de quem vaga sem rumo também (`vagarSemRumo`: uma hora de deriva, 1d6 ardis do intelecto, duas ilhas novas à
// vista). Os PEDAÇOS ENTREGUES à Chishinix entraram: o obelisco
// fica inteiro, os profetas acordam em A3 e o contragolpe deixa de vir em dobro (decisão nossa, porque o livro só diz que
// ela os pede); o cérebro do tubo do refeitório já se tira (`interacoesDaAnima`).
//
// O estado mora em `app.campanha.obelisco8.vazio`.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { damageRoll } from '../core/dice.js';
import { rolarPericia, SKILL_NAME, skillBonus, abilityMod } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { addCondition, removeCondition, mudarExaustao, hasCondition } from '../rules/conditions.js';
import { garantirInventario, WEAPONS, weaponAbility } from '../rules/equipment.js';
import { descansoLongo } from '../rules/descanso.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar } from './comercio.js';
import { PONTOS_VAZIO as PV } from './vazio-mapas.js';
import { darMarco } from './obelisco5-vila.js';
import * as Refens from './refens-obelisco.js';
import { oferecerSocorro } from './socorro-obelisco.js';

const MOVIMENTO = 60;
/** As ilhas do d8, na ordem do livro. */
export const ILHAS = ['cupula', 'ponte', 'charco', 'nematodeo', 'miasma', 'estatua', 'campo', 'anima'];
export const NOME_DA_ILHA = {
  cupula: 'a Cúpula de Cristal', ponte: 'a Ponte Vazia', charco: 'o Charco da Dúvida', nematodeo: 'o Nematódeo',
  miasma: 'o Miasma Ocludente', estatua: 'a Estátua Tombada', campo: 'o Campo de Batalha Lamentoso', anima: 'a Ânima de Ilvaash',
};
/** O que se vê de longe de cada uma (e, com o diário da Ponte lido, o que se sabe dela). */
const DE_LONGE = {
  cupula: 'uma ilha com uma cúpula de cristal escuro no alto',
  ponte: 'uma ilha cercada por um rio escuro, com uma ponte e uma torre',
  charco: 'uma ilha de árvores de musgo pendurado e névoa baixa',
  nematodeo: 'um tubo enorme de carne, com uma caverna numa ponta',
  miasma: 'uma bola de névoa amarelo-esverdeada, que rola devagar',
  estatua: 'uma ilha com uma estátua de metal enorme, caída',
  campo: 'uma ilha de ruínas e fumaça, com uma pirâmide quebrada e um moinho',
  anima: 'uma bacia rasa cercada de tentáculos de pedra, e névoa',
};
const DO_DIARIO = {
  charco: 'o diário fala de nagas que atraem viajantes pela astúcia',
  miasma: 'o diário a chama de bola de névoa venenosa, sem nada no meio que importe',
  estatua: 'o diário fala de um devorador de pedra com boca de gente, caído por ter uma câmara grande demais no alto',
  anima: 'o diário: a casa do deus, uma bacia de tentáculos petrificados e formas na névoa — a única linha sem deboche',
};
/** A VARIANTE de cada ilha (o nome da cena, que escolhe o mapa em `encounter.js`). */
export const VARIANTE_DA_ILHA = { cupula: 'vazioCupula', ponte: 'vazioPonte', charco: 'vazioCharco', nematodeo: 'vazioNematodeo', miasma: 'vazioMiasma', estatua: 'vazioEstatua', campo: 'vazioCampo', anima: 'vazioAnima' };
const ILHA_DA_VARIANTE = Object.fromEntries(Object.entries(VARIANTE_DA_ILHA).map(([k, x]) => [x, k]));
const MAPA_DA_ILHA = { cupula: 'CUPULA', ponte: 'PONTE', charco: 'CHARCO', nematodeo: 'NEMATODEO', miasma: 'MIASMA', estatua: 'ESTATUA', campo: 'CAMPO', anima: 'ANIMA' };

/** O grupo pegou ao menos um fragmento no capítulo 6: o contragolpe do obelisco é em dobro. */
export function grupoPegouFragmento(camp) {
  // o grupo que ENTREGOU os pedaços à Chishinix não os tem mais (`conversaDaChishinix`)
  if (camp.obelisco8?.vazio?.feito?.fragmentosEntregues) return false;
  return Object.values(camp.obelisco6?.fragmentos ?? {}).some(Boolean);
}

/**
 * ONDE ESTÁ CADA FANÁTICO na Ânima, pelos pedaços que eles levam (o livro): 4, a Chishinix em A1, o Hashutu em A2 e o
 * Voalsh em A4; 5, a Chishinix em A1 e os outros dois em A4; 6 ou 7, os três em A4. Com 7, os dois profetas em A3.
 */
export function salasDosFanaticos(n) {
  return {
    chishinix: n <= 5 ? 'A1' : 'A4',
    hashutu: n === 4 ? 'A2' : 'A4',
    voalsh: 'A4',
    profetas: n >= 7,
  };
}

/** O estado do Vazio na campanha. */
export function estadoDoVazio(camp) {
  const o8 = (camp.obelisco8 ??= { feito: {} });
  const v = (o8.vazio ??= { ilha: 'cupula', visitadas: [], aVista: [], feito: {}, mortos: [], descansos: 0 });
  v.feito ??= {};
  v.mortos ??= [];
  v.visitadas ??= [];
  v.aVista ??= [];
  return v;
}

/** Quantos pedaços do obelisco os fanáticos levam: os quatro de Phandalin e os do capítulo 6 que o grupo não pegou. */
export function fragmentosDosFanaticos(camp) {
  if (camp.obelisco8?.vazio?.feito?.fragmentosEntregues) return 7;
  const f = camp.obelisco6?.fragmentos ?? {};
  return 4 + ['talhundereth', 'cripta', 'encruzilhada'].filter((k) => !f[k]).length;
}

/** AS DUAS À VISTA: d8 duas vezes; a atual rola de novo; a Ânima também, antes de cinco outras visitadas. */
export function sortearAVista(rng, atual, visitadas) {
  const outras = new Set(visitadas.filter((i) => i !== 'anima' && i !== atual));
  const uma = () => {
    for (let n = 0; n < 50; n++) {
      const i = ILHAS[rng.die(8) - 1];
      if (i === atual) continue;
      if (i === 'anima' && outras.size + (visitadas.includes(atual) && atual !== 'anima' ? 1 : 0) < 5) continue;
      return i;
    }
    return null;
  };
  return [...new Set([uma(), uma()].filter(Boolean))];
}

export function criarIlhaDoVazio(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const camp = (app.campanha ??= {});
  const v = estadoDoVazio(camp);
  const ilha = config.ilha ?? ILHA_DA_VARIANTE[config.cenaDaVila ?? config.variante] ?? v.ilha ?? 'cupula';
  const P = PV[MAPA_DA_ILHA[ilha]];
  const f = (v.feito[ilha] ??= {});
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null };
  // os reféns que o grupo escolta (`refens-obelisco.js`) andam junto, mas não são do grupo: nem XP, nem passagem de cena
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && !c.refemDoObelisco);
  const herois = () => todos().filter((c) => c.hp > 0);
  const titulo = NOME_DA_ILHA[ilha].replace(/^(a|o) /, '').replace(/^./, (s) => s.toUpperCase());
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); enc.say('acao', `Pista: ${txt}`); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const aqui = (pts, tile) => [].concat(pts ?? []).some((q) => q.x === tile.x && q.y === tile.y);
  const vivo = (x) => x && !x.dead && x.hp > 0 && !x.fugiu;
  const melhor = (pericia) => herois().reduce((a, b) => (skillBonus(b, pericia) > skillBonus(a, pericia) ? b : a));
  const tem = (id) => herois().find((h) => garantirInventario(h).bag.some((i) => i.id === id && (i.qtd ?? 1) > 0));
  const perto = (p, pes) => herois().find((h) => distanceFt(h.pos, p) <= pes);

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  const por = (k, id, pos, nome = null) => {
    const chave = `${ilha}:${k}`;
    if (v.mortos.includes(chave)) return null;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDoVazio = chave;
    m.side = 'neutro';
    elenco[k] = m;
    return m;
  };
  const REFENS_CUPULA = ['Thawnia Browne', 'Shansa', 'Wramble', 'Unmiel'];
  const REFENS_ESTATUA = ['Hovnar Tartesh', 'Menvin Tartesh', 'Nalpina Goldstone', 'Mildra Merkel'];
  if (ilha === 'cupula') {
    P.guardioes.forEach((p, i) => por(`guardiao${i + 1}`, 'guardiaoEscudo', p));
    if (!f.refensSoltos) P.refens.forEach((p, i) => { if (!f[`solto${i}`]) { const r = por(`refem${i + 1}`, 'plebeu', p, REFENS_CUPULA[i]); if (r) r.colado = true; } });
  }
  if (ilha === 'ponte') { por('aboleth', 'aboleth', P.aboleth); por('elemental', 'elementalDaAgua', P.elemental); }
  if (ilha === 'charco') {
    // as nagas renascem: morta, volta depois de um descanso longo no Vazio (o livro: 1d6 dias)
    for (const [k, nome] of [['valsyx', 'Valsyx'], ['charnyz', 'Charnyz']]) {
      const quando = f[`morta:${k}`];
      if (quando != null && v.descansos > quando) { delete f[`morta:${k}`]; v.mortos = v.mortos.filter((x) => x !== `charco:${k}`); f.nagasVoltaram = true; }
      por(k, 'nagaEspiritual', P[k], nome);
    }
  }
  if (ilha === 'nematodeo') P.ardis.forEach((p, i) => por(`ardil${i + 1}`, 'armadilhaDeIntelecto', p));
  if (ilha === 'miasma' && !v.feito.perseguidoresSoltos) P.perseguidores.forEach((p, i) => por(`perseguidor${i + 1}`, 'perseguidorInvisivel', p));
  if (ilha === 'campo') {
    P.w1.forEach((p, i) => por(`w1_${i + 1}`, i === 3 ? 'brutamonteUmbral' : 'mezzoloth', p));
    por('nellik', 'nellik', P.nellik, 'Nellik');
    por('frevvik', 'mezzoloth', P.frevvik, 'Frevvik');
    P.patrulhas.forEach((par, j) => par.forEach((p, i) => por(`patrulha${j + 1}_${i + 1}`, 'mezzoloth', p)));
  }
  if (ilha === 'anima') {
    const onde = salasDosFanaticos(fragmentosDosFanaticos(camp));
    const ob = f.obeliscoEmPo ? null : por('obelisco', 'obeliscoDaAnima', P.obelisco);
    if (ob) ob.contragolpe = { fator: grupoPegouFragmento(camp) ? 2 : 1 };
    const naA4 = [...P.a4];
    const lugar = (sala, deA2) => (sala === 'A1' ? P.chishinix : sala === 'A2' ? deA2 : naA4.shift());
    const chi = por('chishinix', 'devoradorClarividente', f.chishinixRecuou ? naA4.shift() : lugar(onde.chishinix), 'Chishinix');
    if (chi) {
      chi.salaDaAnima = f.chishinixRecuou ? 'A4' : onde.chishinix;
      const cab = por('cabeca', 'cabecaDaChishinix', chi.salaDaAnima === 'A1' ? P.cabeca : P.cabecaNoAlto);
      if (cab) cab.salaDaAnima = chi.salaDaAnima;
    } else por('cabeca', 'cabecaDaChishinix', P.cabeca);
    const has = por('hashutu', 'devoradorClarividente', f.alerta && onde.hashutu === 'A2' ? naA4.shift() : lugar(onde.hashutu, P.hashutu), 'Hashutu');
    if (has) { has.senses = { ...has.senses, blindsightFt: 60 }; has.salaDaAnima = f.alerta ? 'A4' : onde.hashutu; }
    const voa = por('voalsh', 'devoradorClarividente', P.voalsh, 'Voalsh');
    if (voa) {
      Object.assign(voa, { speedFt: 0, flyFt: 30, hover: true, salaDaAnima: 'A4' });
      voa.speeds = { walkFt: 0, flyFt: 30 };
      voa.conditionImmunities = [...new Set([...(voa.conditionImmunities ?? []), 'caido'])];
    }
    for (const m of [chi, has, voa]) if (m && ob) m.ligadoAoObelisco = ob.id;
    if (onde.profetas) P.profetas.forEach((p2, i) => { const pr = por(`profeta${i + 1}`, 'profetaDevoradorDeMentes', p2); if (pr) pr.salaDaAnima = 'A3'; });
  }
  const grupoDe = (prefixo) => Object.entries(elenco).filter(([k, m]) => k.startsWith(prefixo) && vivo(m)).map(([, m]) => m);

  // ------------------------------------------------------- voar, explorar, lutar ----
  /** No Vazio todo mundo voa com o deslocamento a pé, e paira (o voo some fora dele: `tirarVooDoVazio`). */
  function darVoo() {
    for (const c of enc.combatants) {
      if (c.flyFt) continue;
      c.flyFt = c.speedFt ?? 30;
      c.hover = true;
      c.vooDoVazio = true;
    }
  }

  function prepararExploracao() {
    enc.reinforcements = null;
    enc.over = false;
    enc.outcome = null;
    enc.side = 'party';
    enc.round = 1;
    enc.emboscada = null;
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

  function luta(quem, { furtividade = null, reforcos = null } = {}) {
    if (ilha === 'anima' && vivo(elenco.obelisco) && !quem.includes(elenco.obelisco)) quem = [...quem, elenco.obelisco];
    for (const x of quem) {
      if (x.dead) continue;
      x.side = 'foes';
      if (!enc.combatants.includes(x)) enc.addCombatant(x);
    }
    darVoo();
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = furtividade ? { emboscadores: 'foes', furtividade } : null;
    enc.reinforcements = reforcos;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista) {
    const grupo = todos();
    const xp = lista.filter((x) => x.dead || x.fugiu || x.rendido).reduce((s, x) => s + (x.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${titulo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    Refens.guardarRefens(enc, camp);
    fazer(todos());
  }

  // ----------------------------------------------------------- a viagem ----
  function irPara(destino) {
    v.ilha = destino;
    v.aVista = [];
    sair((g) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: VARIANTE_DA_ILHA[destino], continuarCom: g }));
  }

  /** A TRAVESSIA DA NÉVOA MORTAL do Miasma: da borda da nuvem à ilhota (e de volta) são umas duas rodadas de voo, cada
   * uma com o teste da névoa (Constituição CD 17, 5d8 de veneno, metade se passar). */
  function atravessarNevoa(rodadas, linhas) {
    for (const h of [...herois(), ...enc.combatants.filter((c) => c.refemDoObelisco && !c.dead)]) {
      let total = 0;
      for (let r = 0; r < rodadas; r++) {
        const sv = enc.resistencia(h, 'con', 17, { contra: { tipoDano: 'veneno', magico: true } });
        const d = damageRoll(enc.rng, '5d8');
        const dano = sv.success ? Math.floor(d.total / 2) : d.total;
        enc.applyDamage(h, dano, 'veneno', null, { magico: true });
        total += dano;
      }
      linhas.push(`${h.name}: ${total} de veneno na travessia.`);
    }
  }

  async function viajar() {
    const escolhas = v.aVista.map((i) => ({
      rotulo: `Voar até ${i === 'anima' ? 'a bacia de tentáculos' : NOME_DA_ILHA[i]}${v.visitadas.includes(i) ? ' (já esteve lá)' : ''}`, valor: i,
    }));
    escolhas.push({ rotulo: 'Descansar aqui (descanso longo)', valor: 'descansar' });
    // ESPERAR UMA ILHA que já se visitou e sumiu de vista: ela volta em 1d6 dias (o livro), e cada dia é um descanso no
    // Reino Distante, com o teste de Sabedoria de cada um
    const esperaveis = v.visitadas.filter((i) => i !== ilha && !v.aVista.includes(i));
    if (esperaveis.length) escolhas.push({ rotulo: 'Esperar uma ilha conhecida voltar (1d6 dias)', valor: 'esperar' });
    if (ilha !== 'anima') escolhas.push({ rotulo: 'Vagar pelo Vazio atrás de outras ilhas (uma hora)', valor: 'vagar' });
    escolhas.push({ rotulo: 'Ficar', valor: 'ficar', primaria: !escolhas.length });
    const linhas = ['Daqui, na névoa colorida, se veem:', ...v.aVista.map((i) => `— ${DE_LONGE[i]}${v.feito.diarioLido && DO_DIARIO[i] ? ` (${DO_DIARIO[i]})` : ''}.`)];
    if (!v.aVista.length) linhas.push('— nada, por ora. As ilhas derivam; com o tempo, outras aparecem.');
    const r = await painel(linhas, escolhas);
    if (r === 'descansar') return descansar();
    if (r === 'esperar') return esperarIlha(esperaveis);
    if (r === 'vagar') return vagarSemRumo();
    if (r && r !== 'ficar') {
      if (ilha === 'miasma') {
        const linhas = ['Para sair, a mesma névoa de novo, até a borda da nuvem.'];
        atravessarNevoa(2, linhas);
        await painel(linhas);
        if (!herois().length) { estado.encerrado = true; app.encerrarPartida(); return; }
      }
      irPara(r);
    }
  }

  /**
   * VAGAR SEM RUMO: quem flutua solto pelo Vazio, sem ilha à vista, chama 1d6 ardis do intelecto por hora (o livro). É o
   * preço de procurar ilhas sem esperar: uma hora de deriva, a luta com os ardis, e no fim duas ilhas novas à vista. A
   * luta é na beira da ilha de onde o grupo saiu (decisão nossa: o Vazio não tem mapa, e a deriva volta para perto dela).
   */
  async function vagarSemRumo() {
    const r = await painel(['Sair voando sem destino, longe de qualquer ilha, para ver o que há além da névoa. Coisas famintas flutuam no Vazio, e ninguém que vaga sozinho passa despercebido por elas.'], [
      { rotulo: 'Vagar', valor: 'vagar', primaria: true },
      { rotulo: 'Melhor não', valor: 'nao' },
    ]);
    if (r !== 'vagar') return;
    const n = enc.rng.die(6);
    const lider = herois()[0];
    const ardis = [];
    for (let i = 0; i < n; i++) {
      const m = makeMonster('armadilhaDeIntelecto', { ...lider.pos });
      const ang = (i / n) * Math.PI * 2;
      const q = enc.casaLivreMaisProxima({ x: Math.round(lider.pos.x + Math.cos(ang) * 5), y: Math.round(lider.pos.y + Math.sin(ang) * 5) });
      if (!q) continue;
      m.pos = { ...m.pos, x: q.x, y: q.y };
      ardis.push(m);
    }
    estado.depoisDaDeriva = true;
    await painel([`Uma hora de deriva na névoa colorida. Aí, de todos os lados ao mesmo tempo, ${n > 1 ? `${n} coisas` : 'uma coisa'} de pele cinzenta, com fios de nervo pendurados, ${n > 1 ? 'se fecham' : 'se fecha'} em volta de vocês: ardis do intelecto, com fome.`], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    luta(ardis);
  }

  /** Esperar a ilha escolhida voltar: 1d6 dias, cada um um descanso longo no Reino Distante; ela fica à vista no fim. */
  async function esperarIlha(esperaveis) {
    const r = await painel(['Qual delas esperar? As ilhas derivam e voltam, mas não se sabe quando: pode ser amanhã, pode levar quase uma semana, e cada noite no Reino Distante cobra o seu preço.'], [
      ...esperaveis.map((i) => ({ rotulo: `Esperar ${NOME_DA_ILHA[i]}`, valor: i })),
      { rotulo: 'Melhor não', valor: 'nao', primaria: true },
    ]);
    if (!esperaveis.includes(r)) return;
    const dias = enc.rng.die(6);
    for (let d = 0; d < dias && herois().length; d++) await descansar({ calado: d < dias - 1 });
    if (!herois().length) { estado.encerrado = true; app.encerrarPartida(); return; }
    v.aVista = [r, ...v.aVista.filter((i) => i !== r)].slice(0, 2);
    await painel(`${dias > 1 ? `${dias} dias` : 'Um dia'} depois, ${NOME_DA_ILHA[r]} volta a aparecer na névoa, perto o bastante para voar até lá.`);
    app.refresh();
  }

  /** O DESCANSO no Reino Distante: Sabedoria CD 15 de cada um, ou um nível de exaustão; as ilhas à vista mudam. */
  async function descansar({ calado = false } = {}) {
    const linhas = ['O grupo descansa na ilha, com as cores do Vazio girando em volta. Ninguém dorme direito.'];
    for (const h of herois()) {
      descansoLongo(h);
      const sv = enc.resistencia(h, 'wis', 15);
      if (!sv.success) { mudarExaustao(h, 1); linhas.push(`${h.name} (Sabedoria ${sv.total}) acorda pior do que deitou: um nível de exaustão.`); } else linhas.push(`${h.name} (Sabedoria ${sv.total}) acorda inteiro.`);
    }
    v.descansos += 1;
    v.aVista = sortearAVista(enc.rng, ilha, v.visitadas);
    linhas.push('Quando o grupo olha de novo, as ilhas em volta não são mais as mesmas.');
    if (calado) for (const l of linhas.slice(1, -1)) enc.say('acao', l);
    else await painel(linhas);
    app.refresh();
  }

  // ------------------------------------------------------------- os gatilhos ----
  async function depoisDoPasso() {
    if (!estado.explorando) return false;
    const hs = herois();
    // OS PERSEGUIDORES que caçam quem levou a língua: vêm atrás de ilha em ilha
    if (v.feito.perseguidoresSoltos && !v.feito.perseguidoresVieram?.includes(ilha) && v.perseguidoresVivos > 0 && ilha !== 'miasma') {
      (v.feito.perseguidoresVieram ??= []).push(ilha);
      const bando = Array.from({ length: v.perseguidoresVivos }, (_, i) => {
        const m = makeMonster('perseguidorInvisivel', { ...hs[0].pos });
        const q = enc.casaLivreMaisProxima({ x: hs[0].pos.x + 3, y: hs[0].pos.y + 3 });
        if (q) m.pos = { ...m.pos, x: q.x, y: q.y };
        m.chaveDoVazio = `perseguidor:${i}`;
        return m;
      });
      await painel('Um vento que não é vento chega pelas costas, repetindo numa língua de ar a mesma frase: a língua tem de ficar escondida. Os perseguidores vieram atrás.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(bando);
    }
    if (ilha === 'anima') return gatilhosDaAnima(hs);
    if (ilha === 'cupula' && grupoDe('guardiao').some((g) => g.side === 'neutro') && hs.some((h) => aqui(P.dentro, h.pos))) {
      await painel(['Dentro da cúpula, o ar zumbe. Cinco guardiões de pedra em forma de devorador de mentes, cada um do tamanho de um ogro, viram as cabeças para vocês juntos.',
        'Na parede, colados com uma gosma seca a meio metro do chão, quatro moradores de Phandalin gritam o nome de vocês.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(grupoDe('guardiao'));
    }
    if (ilha === 'ponte') {
      // O SÍMBOLO no meio da ponte: quem pisa sem tê-lo achado
      const pisou = hs.find((h) => aqui(P.simbolo, h.pos) && !v.feito.simboloAchado && !(f.simboloPegou ?? []).includes(h.name));
      if (pisou) {
        (f.simboloPegou ??= []).push(pisou.name);
        const sv = enc.resistencia(pisou, 'cha', 19, { contra: { magico: true } });
        if (!sv.success) {
          addCondition(pisou, 'cego', { rounds: 10, source: 'simbolo' });
          addCondition(pisou, 'desesperanca', { rounds: 10, source: 'simbolo' });
        }
        await painel(sv.success ? `Um desenho se acende no chão debaixo de ${pisou.name} (Carisma ${sv.total}), e ${pisou.name} o empurra para fora da cabeça.`
          : `Um desenho se acende no chão debaixo de ${pisou.name} (Carisma ${sv.total}). Os olhos de ${pisou.name} escurecem, e junto vem um desânimo tão fundo que levantar a arma parece sem sentido.`);
      }
      const doRio = grupoDe('').filter((m) => m.side === 'neutro');
      const pertoDoRio = hs.some((h) => [-2, -1, 0, 1, 2].some((dx) => [-2, -1, 0, 1, 2].some((dy) => enc.field.surfaceAt(h.pos.x + dx, h.pos.y + dy) === 'poco')));
      if (doRio.length && (pertoDoRio || pisou)) {
        await painel('A água escura do rio se ergue numa onda que tem forma, e de baixo dela sobe uma coisa enorme, de três olhos e tentáculos, coberta de muco.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(doRio);
      }
    }
    if (ilha === 'charco') {
      const naClareira = hs.some((h) => aqui(P.clareira, h.pos));
      const noVale = hs.some((h) => aqui(P.vale, h.pos));
      const valsyx = elenco.valsyx;
      const charnyz = elenco.charnyz;
      if (naClareira && vivo(valsyx) && valsyx.side === 'neutro' && !f.valsyxFalou) return ardilDasNagas(valsyx, charnyz, 'clareira');
      if (noVale && vivo(charnyz) && charnyz.side === 'neutro' && !f.charnyzFalou) return ardilDasNagas(charnyz, valsyx, 'vale');
    }
    if (ilha === 'nematodeo' && !f.bocaFechou && hs.some((h) => distanceFt(h.pos, P.tenda) <= 10)) return fecharABoca();
    if (ilha === 'campo') {
      // as patrulhas: quem passa a 6 m de um par é visto
      for (const j of [1, 2]) {
        const par = grupoDe(`patrulha${j}_`).filter((m) => m.side === 'neutro');
        if (par.length && hs.some((h) => par.some((m) => distanceFt(h.pos, m.pos) <= 20))) {
          await painel('Da fumaça saem dois mezzoloths, de quatro braços e tridente, e param com um susto. Depois sorriem: a chefe vai gostar disto.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
          return luta(par);
        }
      }
      const w1 = grupoDe('w1_').filter((m) => m.side === 'neutro');
      if (w1.length && hs.some((h) => aqui(P.piramide, h.pos))) {
        const r = await painel(['Dentro da pirâmide rachada, três mezzoloths pintam com carvão o couro de um brutamonte umbral, que pisca, feliz de estar acordado. Eles param, de pincel na mão, culpados.'], [
          ...(v.feito.nellikMorta ? [{ rotulo: 'Contar que a Nellik está morta', valor: 'contar', primaria: true }] : []),
          { rotulo: 'Às armas!', valor: 'luta', primaria: !v.feito.nellikMorta },
        ]);
        if (r === 'contar') {
          for (const m of w1) { const i = enc.combatants.indexOf(m); if (i >= 0) enc.combatants.splice(i, 1); m.fugiu = true; }
          await painel('Os três se olham, largam os pincéis e somem na fumaça, cada um para um lado, aliviados. O brutamonte vai atrás de um deles.');
          app.refresh();
          return false;
        }
        return luta(w1);
      }
      if (vivo(elenco.nellik) && elenco.nellik.side === 'neutro' && !f.nellikViu && distanceFt(hs[0].pos, P.nellik) <= 25) {
        f.nellikViu = true;
        await painel('Perto do moinho, onde a fumaça não chega, uma gárgula musculosa de asas largas afia um machado grande. Um mezzoloth de vigia, com uma trompa, cutuca o braço dela. Ela olha vocês, sem pressa. — Gente que fala. Que raro.');
        return false;
      }
    }
    return false;
  }

  // ------------------------------------------------------- a altura da Ânima ----
  // A ÂNIMA TEM QUATRO ALTURAS (o livro): a plataforma de chegada e A4 a 3 m acima do chão de A1 a A3, e o estrado do
  // obelisco a 6 m. Todos voam no Vazio, então o desnível não barra ninguém nem custa passo (`grid.js`: quem voa não paga
  // subida); o que ele muda é o que a altura sempre muda no motor — a cobertura de quem atira de baixo por cima da borda
  // e a linha de visão que a borda corta. Um nível de altura são 1,5 m: 3 m são dois, 6 m são quatro.
  function alturasDaAnima() {
    const fd = enc.field;
    const ob = P.obelisco;
    for (let y = 0; y < fd.h; y++) for (let x = 0; x < fd.w; x++) {
      const s = P.salas?.[y]?.[x];
      if (s !== 'p' && s !== '4') continue;
      const estrado = s === '4' && ob && Math.max(Math.abs(x - ob.x), Math.abs(y - ob.y)) <= 2;
      fd.heights[y * fd.w + x] = estrado ? 4 : 2;
    }
  }

  // ------------------------------------------------------- o moinho e a fumaça ----
  // O CAMPO DE BATALHA: a fumaça de enxofre deixa o campo inteiro levemente obscurecido (a penumbra da grade de luz, que é
  // como o motor lê "levemente obscurecido": Percepção pela vista e esconder-se), menos a até 9 m do moinho enquanto pelo
  // menos duas das três pás girarem. Cada pá é um OBJETO do livro (CA 13, 30 PV, imune a veneno e psíquico), posto como
  // uma zona que se golpeia casa a casa, o caminho das muralhas que se quebram (`combat.js golpearMuralha`). O PV de cada
  // uma fica no estado da ilha. Quebrar a pá com a Nellik em paz é atacar a casa dela: ela e o Frevvik vêm (decisão nossa).
  const PAS_DO_MOINHO = 'pasDoMoinho';
  function casasDasPas() {
    const m = P.moinhoDentro;
    if (!m) return [];
    const livres = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== 2) continue;
      const q = { x: m.x + dx, y: m.y + dy };
      if (!enc.field.inside(q.x, q.y) || enc.field.blocksMove(q.x, q.y)) continue;
      livres.push({ ...q, ang: Math.atan2(dy, dx) });
    }
    // três bem espalhadas: a primeira e as que ficam mais longe das já escolhidas
    const escolha = [];
    for (const q of livres.sort((a, b) => a.ang - b.ang)) {
      if (escolha.length >= 3) break;
      if (escolha.every((e) => Math.max(Math.abs(e.x - q.x), Math.abs(e.y - q.y)) >= 3)) escolha.push(q);
    }
    return escolha.map(({ x, y }) => ({ x, y }));
  }
  function montarMoinho() {
    const casas = casasDasPas();
    f.pas ??= casas.map(() => 30);
    const vivas = casas.map((q, i) => [q, f.pas[i]]).filter(([, pv]) => pv > 0);
    enc.zonas = (enc.zonas ?? []).filter((z) => z.id !== PAS_DO_MOINHO);
    if (vivas.length) {
      enc.zonas.push({
        id: PAS_DO_MOINHO, spellId: 'paDoMoinho', nome: 'pá do moinho', em: 'na', lado: 'cenario', rodadas: Infinity,
        casas: new Set(vivas.map(([q]) => `${q.x},${q.y}`)), inofensiva: true,
        objeto: { ca: 13, pv: 30, imune: ['veneno', 'psíquico'] },
        pvDoTrecho: new Map(vivas.map(([q, pv]) => [`${q.x},${q.y}`, pv])),
      });
    }
    estado.casasDasPas = casas;
    aplicarFumaca();
  }
  const pasGirando = () => (f.pas ?? []).filter((pv) => pv > 0).length;
  function aplicarFumaca() {
    const { w, h } = enc.field;
    const m = P.moinhoDentro;
    const limpa = pasGirando() >= 2;
    const g = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = limpa && m && distanceFt({ x, y }, m) <= 30 ? 2 : 1;
    enc.field.luz = g;
  }
  async function pasGolpeadas(ev) {
    const zona = ev.zona;
    if (zona?.id !== PAS_DO_MOINHO) return;
    const antes = pasGirando();
    (estado.casasDasPas ?? []).forEach((q, i) => { f.pas[i] = zona.pvDoTrecho?.get(`${q.x},${q.y}`) ?? 0; });
    if (pasGirando() < antes) {
      enc.say('acao', pasGirando() >= 2 ? 'Uma pá do moinho se parte e cai. As outras continuam girando.' : 'Mais uma pá se parte, e o moinho para. A fumaça de enxofre avança devagar e cobre o moinho também.');
      aplicarFumaca();
    }
    if (estado.explorando && vivo(elenco.nellik) && elenco.nellik.side === 'neutro') {
      await painel('A Nellik se levanta de um salto, machado na mão. — É o meu moinho. — O Frevvik já leva a trompa à boca.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      lutarComANellik();
    }
    app.refresh();
  }

  // ------------------------------------------------------------- a Ânima ----
  const salaDa = (pos) => ({ 1: 'A1', 2: 'A2', 3: 'A3', 4: 'A4', p: 'plataforma' })[P.salas?.[pos.y]?.[pos.x]] ?? null;
  const fanaticos = () => ['chishinix', 'hashutu', 'voalsh'].map((k) => elenco[k]).filter(vivo);
  const naSala = (sala) => Object.values(elenco).filter((m) => vivo(m) && m.side === 'neutro' && m.salaDaAnima === sala && m !== elenco.obelisco);

  async function gatilhosDaAnima(hs) {
    const salas = new Set(hs.map((h) => salaDa(h.pos)));
    // A1: a Chishinix, emburrada, dando petisco à cabeça. Conversa para ganhar tempo, e ataca.
    const chi = elenco.chishinix;
    if (vivo(chi) && chi.side === 'neutro' && chi.salaDaAnima === 'A1' && (salas.has('A1') || hs.some((h) => distanceFt(h.pos, chi.pos) <= 30))) {
      return conversaDaChishinix();
    }
    // A2: o Hashutu, comendo um cérebro e remoendo os fracassos
    const has = elenco.hashutu;
    if (vivo(has) && has.side === 'neutro' && has.salaDaAnima === 'A2' && salas.has('A2')) {
      await painel(['No refeitório, entre os tubos que pingam roxo, um devorador de mentes come um cérebro com as mãos, devagar, falando sozinho dos que deram errado. É o Hashutu. Ele vira a cabeça sem olhos para vocês: não precisa de olhos para saber onde estão.'],
        [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta([has]);
    }
    // A3: os dois profetas, chamados com a sobra de poder dos sete pedaços
    if (salas.has('A3') && naSala('A3').length) {
      await painel(['Na câmara das lajes, dois devoradores de mentes de olhos acesos se levantam do altar ao mesmo tempo, como se um só pensamento os pusesse de pé. Não dizem nada.'],
        [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(naSala('A3'));
    }
    // A4: o mirante da cova, com o obelisco no estrado. Quem está aqui luta até morrer.
    if (salas.has('A4') && naSala('A4').length) {
      const n = naSala('A4').filter((m) => m.ligadoAoObelisco).length;
      await painel([`No alto, entre arcos de tentáculos, um obelisco negro remendado pulsa num estrado, costurado por veios de energia verde. ${n > 1 ? `${n} devoradores de mentes` : 'Um devorador de mentes'} trabalha${n > 1 ? 'm' : ''} em volta dele, e para${n > 1 ? 'm' : ''} ao mesmo tempo.`,
        'Na cova do meio, na névoa, Phandalin aparece e some, pequena como um brinquedo. Os gritos que sobem de lá têm vozes que vocês conhecem.'],
      [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      return luta(naSala('A4'));
    }
    return false;
  }

  async function conversaDaChishinix() {
    const chi = elenco.chishinix;
    const pegou = grupoPegouFragmento(camp);
    const r = await painel(['Na entrada, sob correntes de globos violeta, uma devoradora de mentes sentada de lado dá pedacinhos de alguma coisa a uma cabeça cortada, que anda sobre fios de nervo. É a Chishinix. Ela não se levanta.',
      '— Vocês vieram de longe para assistir — diz, na cabeça de cada um. — Quantos pedaços trouxeram? Digam e eu digo o que vale.'], [
      { rotulo: 'Conversar', valor: 'conversar', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
    ]);
    if (r === 'conversar' && pegou) {
      // O PEDIDO DA CHISHINIX: os pedaços em troca de um lugar alto no Império da Mente. Entregues, o obelisco fica inteiro
      // (os sete pedaços chamam os profetas para A3) e o contragolpe deixa de vir em dobro — e ela ataca do mesmo jeito,
      // que é o que o livro diz dela: em paz, não aguenta muito.
      const e = await painel(['— Vocês têm pedaços do obelisco. Eu sinto. — A cabeça para de mastigar. — Deem-nos a mim, e quando o Império da Mente abrir, vocês terão um lugar alto nele. Recusem, e eu os tomo dos seus corpos.'], [
        { rotulo: 'Recusar', valor: 'recusar', primaria: true },
        { rotulo: 'Entregar os pedaços do obelisco', valor: 'entregar' },
      ]);
      if (e === 'entregar') {
        v.feito.fragmentosEntregues = true;
        if (elenco.obelisco) elenco.obelisco.contragolpe = { fator: 1 };
        if (!elenco.profeta1 && !elenco.profeta2) {
          P.profetas.forEach((p2, i) => {
            const pr = por(`profeta${i + 1}`, 'profetaDevoradorDeMentes', p2);
            if (!pr) return;
            pr.salaDaAnima = 'A3';
            const q = enc.casaLivreMaisProxima(p2);
            if (q) pr.pos = { ...pr.pos, x: q.x, y: q.y };
            enc.addCombatant(pr);
          });
        }
        await painel(['Os pedaços saem das mochilas sozinhos, voando até ela, e somem no estrado lá em cima. O obelisco inteiro brilha de verde, mais forte, e em algum lugar da Ânima duas coisas novas acordam.',
          '— Obrigada — diz a Chishinix, e sorri pela primeira vez. — O lugar alto é para quem já é um de nós. — Os olhos dela se apagam por um instante, e ela se levanta.']);
        pista('Os pedaços do obelisco foram entregues à Chishinix: o obelisco está inteiro, e o contragolpe dele não vem mais em dobro.');
      } else {
        await painel('Ela não espera mais nada. Os olhos dela se apagam por um instante — está falando com alguém lá em cima — e ela se levanta.');
      }
    } else if (r === 'conversar') {
      await painel(['— Nenhum? Então vieram só morrer. — Ela suspira, de verdade. — Que pena. Eu queria saber como acabava.',
        'Os olhos dela se apagam por um instante — está falando com alguém lá em cima — e ela se levanta.']);
    }
    pista('A Chishinix, na entrada da Ânima, avisou os outros fanáticos pela mente: eles esperam no alto, junto do obelisco.');
    alertar();
    return luta([chi, elenco.cabeca].filter(vivo));
  }

  /** O aviso pela mente: quem está no refeitório sobe para o obelisco. */
  function alertar() {
    if (f.alerta) return;
    f.alerta = true;
    const has = elenco.hashutu;
    if (vivo(has) && has.side === 'neutro' && has.salaDaAnima === 'A2') {
      const q = enc.casaLivreMaisProxima(P.a4[1]);
      if (q) has.pos = { ...has.pos, x: q.x, y: q.y };
      has.salaDaAnima = 'A4';
    }
  }

  /** A Chishinix abaixo de 30 PV recua voando para junto dos outros, e a cabeça fica. */
  function recuoDaChishinix() {
    const chi = elenco.chishinix;
    if (!vivo(chi) || chi.side !== 'foes' || chi.hp >= 30 || f.chishinixRecuou || chi.salaDaAnima !== 'A1') return;
    const outros = fanaticos().filter((m) => m !== chi);
    if (!outros.length) return;
    f.chishinixRecuou = true;
    const q = enc.casaLivreMaisProxima(P.a4[0]);
    chi.side = 'neutro';
    chi.salaDaAnima = 'A4';
    if (q) chi.pos = { ...chi.pos, x: q.x, y: q.y };
    for (const c of [...(chi.conditions ?? [])]) if (c.data?.escape != null) removeCondition(chi, c.id);
    estado.lutando = (estado.lutando ?? []).filter((m) => m !== chi);
    enc.say('acao', 'A Chishinix, ferida, sobe voando pelo meio dos arcos e some no alto, para junto dos outros. A cabeça fica.');
    enc.checkEnd();
    app.refresh();
  }

  /** Mortos os três fanáticos, o obelisco vira pó: o desenho quebrado acende e ele sai da luta. */
  function obeliscoViraPo() {
    if (f.obeliscoEmPo || fanaticos().length) return;
    f.obeliscoEmPo = true;
    const ob = elenco.obelisco;
    if (ob) {
      ob.dead = true;
      ob.hp = 0;
      v.mortos.push(ob.chaveDoVazio);
    }
    enc.field.alternarSobreposicao?.('obeliscoQuebrado', true);
    enc.say('acao', 'O último fanático cai, e as costuras verdes do obelisco se apagam todas de uma vez. A pedra se desfaz em pó negro, que escorre do estrado como areia.');
    enc.checkEnd();
    app.refresh();
  }

  async function ardilDasNagas(naga, outra, onde) {
    const f2 = onde === 'clareira' ? 'valsyxFalou' : 'charnyzFalou';
    f[f2] = true;
    const texto = onde === 'clareira'
      ? ['Numa clareira, diante de uma pedra baixa, uma serpente enorme de cabeça quase humana levanta o corpo. — Odeio violência — diz, com a voz mansa. — Respondam uma charada minha, e eu conto uma coisa que vale a viagem.']
      : ['Num vale de arbustos podados em forma de bichos, uma serpente enorme de cabeça quase humana sorri. — Um jogo — propõe. — Um de vocês vira o rosto; eu faço cópias de uma cobrinha d\'água; ele aponta a verdadeira, sem tocar. Acertou, eu conto uma coisa.'];
    const r = await painel(texto, [
      { rotulo: onde === 'clareira' ? 'Ouvir a charada' : 'Aceitar o jogo', valor: 'ardil', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
      { rotulo: 'Ir embora', valor: 'sair' },
    ]);
    if (r === 'sair') return false;
    const reforco = vivo(outra) ? [outra] : [];
    if (r === 'ardil') {
      await painel(onde === 'clareira'
        ? 'A charada não tem resposta. As palavras que ele grita mais alto, quando vocês pedem para repetir, não são para vocês. Do mato fechado em volta, alguma coisa responde.'
        : 'As cobrinhas de ilusão têm guizos, e fazem um barulho que não é para vocês. Do mato fechado em volta, alguma coisa responde.',
      [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    }
    // a outra chega pela porta dimensional, escondida no mato perto
    for (const o of reforco) { const q = enc.casaLivreMaisProxima({ x: naga.pos.x + 3, y: naga.pos.y + 2 }); if (q) o.pos = { ...o.pos, x: q.x, y: q.y }; }
    const bando = [naga, ...reforco];
    return luta(bando, { furtividade: r === 'ardil' ? bando.map((m) => rolarPericia(enc.rng, m, 'furtividade').total) : null });
  }

  async function fecharABoca() {
    f.bocaFechou = true;
    const linhas = ['A tenda de osso no fundo da caverna se abre como uma flor, e atrás dela há uma garganta. No mesmo instante, dentes de pedra sobem do chão e do teto, e a boca começa a fechar.'];
    const naBoca = herois().filter((h) => aqui(P.dentroDaBoca, h.pos));
    for (const h of naBoca) {
      const sv = enc.resistencia(h, 'dex', 20);
      if (!sv.success) {
        const q = enc.casaLivreMaisProxima(P.ardis[0]);
        if (q) h.pos = { ...h.pos, x: q.x, y: q.y };
        linhas.push(`${h.name} (Destreza ${sv.total}) é empurrado para a garganta.`);
      } else linhas.push(`${h.name} (Destreza ${sv.total}) se segura entre os dentes.`);
    }
    for (const e of P.arestasDaBoca) enc.field.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.parede);
    for (const e of P.arestasDaTenda) enc.field.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.aberta);
    linhas.push('A boca se fecha. Lá dentro fica escuro como o fundo de um poço. Da garganta, duas coisas de tentáculos sobem flutuando.');
    await painel(linhas, [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    return luta(grupoDe('ardil'));
  }

  function abrirABoca(porque) {
    f.bocaAberta = true;
    for (const e of P.arestasDaBoca) enc.field.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.aberta);
    enc.say('acao', porque);
    app.refresh();
  }

  // --------------------------------------------------------------- o evento ----
  function evento(ev) {
    Refens.eventoDosRefens(enc, camp, ev);
    if (ev.type === 'golpeNaMuralha' && ilha === 'campo') { pasGolpeadas(ev); return; }
    if (ilha === 'anima') {
      if (ev.type === 'damage' && ev.target === elenco.chishinix) recuoDaChishinix();
      if (ev.type === 'died' && ev.target?.ligadoAoObelisco) obeliscoViraPo();
    }
    if (ev.type !== 'died') return;
    const m = ev.target;
    // o brutamonte foge se os mezzoloths da pirâmide caem
    if (ilha === 'campo' && /^w1_/.test(Object.keys(elenco).find((k) => elenco[k] === m) ?? '')) {
      const hulk = elenco.w1_4;
      if (vivo(hulk) && hulk.side === 'foes' && !grupoDe('w1_').some((x) => x !== hulk && x.side === 'foes')) {
        hulk.fugiu = true;
        const i = enc.combatants.indexOf(hulk);
        if (i >= 0) enc.combatants.splice(i, 1);
        enc.say('acao', 'Sem os mezzoloths, o brutamonte umbral cava o chão com as garras e some por baixo.');
        enc.checkEnd();
        app.refresh();
      }
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      // vencidos pelos fanáticos na Ânima, o livro manda o grupo de socorro (`socorro-obelisco.js`)
      if (ilha === 'anima' && await oferecerSocorro(app, camp, enc.combatants.filter((c) => c.side === 'party' && !c.refemDoObelisco && !c.invocado), 'anima')) return;
      await narrar(root, { formato: 'tela', paginas: [{ titulo, texto: ['O Vazio fica com vocês. As cores continuam girando, para ninguém.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const x of lutou) {
      if (!(x.dead || x.fugiu) || !x.chaveDoVazio) continue;
      if (x.chaveDoVazio.startsWith('perseguidor:')) continue;
      v.mortos.push(x.chaveDoVazio);
      if (ilha === 'charco' && x.dead) f[`morta:${x.chaveDoVazio.split(':')[1]}`] = v.descansos;
    }
    // os perseguidores que vieram atrás: os que caíram não voltam
    if (lutou.some((x) => x.chaveDoVazio?.startsWith('perseguidor'))) v.perseguidoresVivos = lutou.filter((x) => /perseguidor/.test(x.chaveDoVazio ?? '') && !x.dead).length;
    if (ilha === 'miasma' && lutou.some((x) => x.defId === 'perseguidorInvisivel')) v.perseguidoresVivos = lutou.filter((x) => x.defId === 'perseguidorInvisivel' && !x.dead).length;
    await darXpDe(lutou);
    if (ilha === 'campo' && elenco.nellik?.dead && !v.feito.nellikMorta) {
      v.feito.nellikMorta = true;
      pista('A Nellik está morta. A Ashripask, no labirinto, queria isso; os mezzoloths da pirâmide, se ouvirem, vão embora.');
    }
    if (ilha === 'nematodeo' && f.bocaFechou && !f.bocaAberta) enc.say('acao', 'A boca continua fechada. Só a membrana, lá no fundo da garganta, a abre.');
    if (ilha === 'anima') {
      // o obelisco volta a ser pedra parada até a próxima luta; quem foi morto pelo contragolpe longe da luta conta
      if (vivo(elenco.obelisco)) elenco.obelisco.side = 'neutro';
      const longeDaLuta = fanaticos().length < 3 ? ['chishinix', 'hashutu', 'voalsh'].map((k) => elenco[k]).filter((m) => m?.dead && !lutou.includes(m)) : [];
      for (const m of longeDaLuta) if (!v.mortos.includes(m.chaveDoVazio)) { v.mortos.push(m.chaveDoVazio); lutou.push(m); }
      if (f.obeliscoEmPo && !f.marco12) {
        f.marco12 = true;
        await painel(['O obelisco virou pó. Na cova do meio, a Phandalin pequena some na névoa e não volta; os gritos param no meio de uma palavra.',
          'O que os fanáticos estavam terminando não vai terminar. Falta sair daqui: de volta pela estrela sem luz, pela Poça acima.']);
        const sobem = darMarco(todos(), 12);
        if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
        pista('O obelisco virou pó na Ânima de Ilvaash: os fanáticos estão mortos. Agora é voltar pela estrela sem luz e subir a Poça.');
      }
    }
    if (estado.depoisDaDeriva) {
      estado.depoisDaDeriva = false;
      v.aVista = sortearAVista(enc.rng, ilha, v.visitadas);
      await painel(['Os ardis caem, e a deriva continua. Uma hora depois, vocês voltam a pousar na ilha de onde saíram — e, do alto, viram outras.',
        ...v.aVista.map((i) => `— ${DE_LONGE[i]}.`)]);
    }
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    // A VIAGEM: de qualquer lugar, no próprio herói
    if (tile.x === c.pos.x && tile.y === c.pos.y) {
      ops.push({ rotulo: 'Voar para outra ilha', icone: 'acao-disparada', detalhe: v.aVista.length ? `${v.aVista.length} à vista` : 'nenhuma à vista', fazer: () => viajar() });
    }
    // OS QUE ESPERAM: de volta à ilha, o grupo pode levá-los agora
    const esperando = Refens.estadoDosRefens(camp).esperando[ilha];
    if (esperando?.length && tile.x === c.pos.x && tile.y === c.pos.y) {
      ops.push({ rotulo: 'Chamar os reféns que esperam', icone: 'acao-procurar', detalhe: esperando.join(', '), fazer: () => levarOuDeixar(ilha, P.refens?.map((_, i) => elenco[`refem${i + 1}`]).filter(Boolean) ?? []) });
    }
    if (ilha === 'cupula') {
      P.refens.forEach((p, i) => {
        const r = elenco[`refem${i + 1}`];
        if (!aqui(p, tile) || !r?.colado) return;
        ops.push({ rotulo: `Soltar ${r.name}`, icone: 'acao-usarObjeto', detalhe: 'Atletismo CD 12', motivo: longe(c, tile), fazer: async () => {
          const t2 = rolarPericia(enc.rng, c, 'atletismo');
          if (t2.total < 12) { await painel(`${c.name} (${SKILL_NAME.atletismo} ${t2.total}) puxa, e a gosma seca não cede.`); return; }
          r.colado = false;
          f[`solto${i}`] = true;
          enc.say('acao', `${c.name} (${SKILL_NAME.atletismo} ${t2.total}) arranca ${r.name} da parede.`);
          if (P.refens.every((_, j) => f[`solto${j}`])) await contaramNaCupula();
          app.refresh();
        } });
      });
      if (aqui(P.furo, tile)) {
        ops.push({ rotulo: 'Tocar o furo', icone: 'acao-disparada', detalhe: 'de volta ao fundo da Poça', motivo: longe(c, tile),
          fazer: () => sair((g) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'pocaSalgada', continuarCom: g })) });
      }
    }
    if (ilha === 'ponte') {
      if (aqui(P.simbolo, tile) && !v.feito.simboloAchado) {
        ops.push({ rotulo: 'Examinar o chão da ponte', icone: 'acao-procurar', detalhe: 'Investigação CD 19', motivo: longe(c, tile, 10), fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'investigacao');
          if (r.total < 19) { await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) não vê nada além de pedra.`); return; }
          v.feito.simboloAchado = true;
          await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) vê o desenho gravado na pedra: um símbolo armado. Agora que se sabe dele, passa-se pela beirada.`);
        } });
      }
      if (aqui(P.escritorio, tile)) {
        if (!v.feito.diarioLido) {
          ops.push({ rotulo: 'Ler o diário', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
            v.feito.diarioLido = true;
            await painel(['O diário do mago, sujo de sangue e de coisa pior, é arrogante página a página. Ele jurava que o amuleto o tornava invisível a Ilvaash.',
              'As ilhas derivam num ciclo, escreve ele; cada uma tem a sua gravidade e o seu chão. Ele não construiu a ponte nem a torre: a ponte tem um selo que ele nem se deu ao trabalho de estudar.',
              'Uma ilha de pântano com nagas espertas. Uma bola de névoa venenosa sem nada que importe no meio. Uma estátua de devorador com boca de gente, caída. E a casa do deus: uma bacia de tentáculos petrificados e formas na névoa. Essa é a única linha escrita sem deboche.']);
            pista('O diário da Ponte Vazia descreve as ilhas: um pântano de nagas, a bola de névoa venenosa, a estátua tombada, e a casa do deus — uma bacia de tentáculos de pedra na névoa.');
          } });
        }
        if (!f.tesouro) {
          ops.push({ rotulo: 'Revistar o escritório', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
            f.tesouro = true;
            guardar(c, 'amuletoContraDeteccao', 1);
            guardar(c, 'globoDeNeve', 1);
            guardar(c, 'estatuetaDeBasilisco', 1);
            guardar(c, 'aliancaDeOuro', 6);
            await painel(`No pescoço do morto, um amuleto. Na estante, um globo de neve com uma feira dentro, um basilisco de platina e, numa caixinha, seis alianças de ouro. ${c.name} guarda tudo.`);
            app.refresh();
          } });
        }
      }
    }
    if (ilha === 'charco') {
      if (aqui(P.pedra, tile) && !f.pergaminho && !vivo(elenco.valsyx)) {
        ops.push({ rotulo: 'Folhear o livro encharcado', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => { f.pergaminho = true; guardar(c, 'pergaminhoDeConeDeFrio', 1); enc.say('acao', `Entre as páginas ilegíveis, um pergaminho seco. ${c.name} o guarda.`); app.refresh(); } });
      }
      if (aqui(P.arbustos, tile) && !f.opalas && !vivo(elenco.charnyz)) {
        ops.push({ rotulo: 'Tirar as pedras dos arbustos', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: () => { f.opalas = true; guardar(c, 'opalaDoCharco', 9); enc.say('acao', `Nove arbustos, nove opalas. ${c.name} guarda as nove.`); app.refresh(); } });
      }
    }
    if (ilha === 'nematodeo' && aqui(P.membrana, tile) && f.bocaFechou && !f.bocaAberta) {
      if (!f.entendeuMembrana) {
        ops.push({ rotulo: 'Estudar a membrana', icone: 'acao-procurar', detalhe: 'Medicina ou Natureza CD 10', motivo: longe(c, tile), fazer: async () => {
          const r = [rolarPericia(enc.rng, c, 'medicina'), rolarPericia(enc.rng, c, 'natureza')].reduce((a, b) => (b.total > a.total ? b : a));
          if (r.total < 10) { await painel(`${c.name} (${r.total}) não entende o que está vendo.`); return; }
          f.entendeuMembrana = true;
          await painel(`${c.name} (${r.total}) entende: rasgar a membrana inteira faria o bicho vomitar tudo o que tem dentro. Um furo pequeno, no ponto certo, só o faria abrir a boca.`);
        } });
      } else if (!f.achouPonto) {
        ops.push({ rotulo: 'Procurar o ponto certo', icone: 'acao-procurar', detalhe: 'Medicina ou Percepção CD 16', motivo: longe(c, tile), fazer: async () => {
          const r = [rolarPericia(enc.rng, c, 'medicina'), rolarPericia(enc.rng, c, 'percepcao')].reduce((a, b) => (b.total > a.total ? b : a));
          if (r.total < 16) { await painel(`${c.name} (${r.total}) não acha onde a membrana é nem grossa nem fina demais.`); return; }
          f.achouPonto = true;
          await painel(`${c.name} (${r.total}) acha o ponto: um lugar onde a membrana pulsa mais devagar.`);
        } });
      } else {
        ops.push({ rotulo: 'Furar no ponto certo', icone: 'acao-usarObjeto', detalhe: '10 de dano perfurante', motivo: longe(c, tile), fazer: () => furarMembrana(c) });
      }
      ops.push({ rotulo: 'Rasgar a membrana', icone: 'acao-usarObjeto', detalhe: 'ela vomita tudo', motivo: longe(c, tile), fazer: () => rasgarMembrana() });
    }
    if (ilha === 'miasma' && aqui(P.lingua, tile) && !v.feito.lingua) {
      ops.push({ rotulo: 'Pegar a fita de metal', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        v.feito.lingua = true;
        guardar(c, 'linguaDeMetal', 1);
        v.feito.perseguidoresSoltos = true;
        const ps = grupoDe('perseguidor');
        v.perseguidoresVivos = ps.length;
        // eles SABEM na hora; mas não enxergam pela névoa, e caçam o ladrão onde ele for (aqui, na próxima ilha)
        for (const m of ps) { const i = enc.combatants.indexOf(m); if (i >= 0) enc.combatants.splice(i, 1); }
        if (ps.length) await painel('No instante em que a fita sai da terra, o ar da névoa se mexe em três lugares de uma vez — e se afasta, devagar, em volta de vocês. Alguma coisa sabe o que vocês fizeram, e vai esperar.');
        app.refresh();
      } });
    }
    if (ilha === 'estatua') {
      if (aqui(P.boca, tile) && !f.baseAberta && tem('linguaDeMetal')) {
        ops.push({ rotulo: 'Pôr a língua de metal na boca', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
          f.baseAberta = true;
          for (const q of P.porta) enc.field.porAresta(q.a.x, q.a.y, q.b.x, q.b.y, ARESTA.aberta);
          await painel('A fita de metal encaixa no toco com um estalo e trava. Lá na base, o sorriso enorme se abre como uma boca de verdade, e de dentro quatro vozes gritam ao mesmo tempo.');
          await contaramNaEstatua(true);
          app.refresh();
        } });
      }
      if (aqui(P.sorriso, tile) && !f.gritou && !f.baseAberta) {
        ops.push({ rotulo: 'Gritar pela fresta', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => contaramNaEstatua(false) });
      }
    }
    if (ilha === 'anima') ops.push(...interacoesDaAnima(tile, c));
    // as pás do moinho: explorando, golpeia-se de graça (o tempo não conta), um ataque por vez
    if (ilha === 'campo' && enc.muralhaEm(tile.x, tile.y)?.id === PAS_DO_MOINHO) {
      const pv = enc.muralhaEm(tile.x, tile.y).pvDoTrecho.get(`${tile.x},${tile.y}`);
      ops.push({ rotulo: 'Golpear a pá do moinho', icone: 'acao-atacar', detalhe: `CA 13, ${pv} PV`, motivo: estado.explorando ? null : 'na luta, use o ataque', fazer: () => {
        c.actionUsed = false;
        c.ataquesRestantes = 0;
        const r = enc.golpearMuralha(c, tile);
        c.actionUsed = true;
        if (!r.ok) enc.say('aviso', r.why);
        app.refresh();
      } });
    }
    if (ilha === 'campo' && vivo(elenco.nellik) && elenco.nellik.side === 'neutro' && distanceFt(tile, elenco.nellik.pos) <= 5) {
      ops.push({ rotulo: 'Falar com a Nellik', icone: 'acao-procurar', motivo: longe(c, tile, 15), fazer: () => conversaDaNellik() });
    }
    return ops;
  }

  function interacoesDaAnima(tile, c) {
    const ops = [];
    if (aqui(P.tubos, tile)) {
      ops.push({ rotulo: 'Pôr a mão num tubo', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        const vez = (f.tubos = (f.tubos ?? 0) + 1);
        await painel(vez <= 3
          ? `Um ruído molhado sobe pelo tubo, e pela boca dele escorrega, devagar, um cérebro humano fresco. ${c.name} não o pega, e ele cai no chão com um som que ninguém vai esquecer.`
          : 'Os três tubos estão vazios por ora. Daqui a uma hora, cada um solta outro.');
      } });
    }
    if (aqui(P.prateleira, tile) && !f.pocao) {
      ops.push({ rotulo: 'Pegar o frasco', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
        f.pocao = true;
        guardar(c, 'pocaoDeCuraSuprema', 1);
        await painel(`${c.name} tira da prateleira um frasco que brilha vermelho por dentro: uma poção de cura suprema.`);
        app.refresh();
      } });
    }
    if (aqui(P.altar, tile)) {
      if (!f.tabuletas) {
        ops.push({ rotulo: 'Ler as tabuletas', icone: 'acao-procurar', detalhe: 'Arcanismo ou Investigação, CD 16', motivo: longe(c, tile), fazer: async () => {
          const per = skillBonus(c, 'arcanismo') >= skillBonus(c, 'investigacao') ? 'arcanismo' : 'investigacao';
          const t = rolarPericia(enc.rng, c, per);
          if (t.total < 16) { await painel(`${c.name} (${SKILL_NAME[per]} ${t.total}) lê as tabuletas: falam de remontar o obelisco, pedaço a pedaço. O resto escapa.`); return; }
          f.tabuletas = true;
          await painel([`${c.name} (${SKILL_NAME[per]} ${t.total}) entende as tabuletas: são as notas de quem remontou o obelisco.`,
            'Remendar a pedra com a costura verde deixou uma fraqueza. O obelisco não se quebra, mas o que o fere passa pela costura e volta sobre quem está ligado a ele — os fanáticos, o mais perto primeiro.']);
          pista('As tabuletas do altar da Ânima: o que fere o obelisco volta sobre os fanáticos ligados a ele, o mais perto primeiro.');
        } });
      }
      if (!f.diamantes) {
        ops.push({ rotulo: 'Arrancar os diamantes da estátua', icone: 'acao-usarObjeto', motivo: longe(c, tile), fazer: async () => {
          f.diamantes = true;
          guardar(c, 'diamanteDaEstatua', 4);
          await painel(`${c.name} arranca da estátua-cérebro quatro diamantes do tamanho de uma noz.`);
          app.refresh();
        } });
      }
    }
    // A VOLTA: mortos os fanáticos, da plataforma se volta pela estrela sem luz e pela Poça acima
    if (f.obeliscoEmPo && salaDa(tile) === 'plataforma' && tile.x === c.pos.x && tile.y === c.pos.y) {
      ops.push({ rotulo: 'Voltar pela estrela sem luz', icone: 'acao-disparada', fazer: async () => {
        await painel('O grupo voa de volta até a Cúpula, acha a estrela sem luz no chão da plataforma e a toca. O líquido escuro volta de uma vez, frio, e o fundo da Poça está em volta de novo.');
        sair((g) => { tirarVooDoVazio(g); app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'pocaSalgada', continuarCom: g }); });
      } });
    }
    return ops;
  }

  /**
   * LEVAR OU DEIXAR: soltos, os reféns aceitam esperar na ilha (o livro); o grupo pode levá-los consigo. Quem vem junto
   * passa a andar com o grupo (`refens-obelisco.js`); quem fica, espera — e fica no Reino Distante se ninguém voltar.
   */
  async function levarOuDeixar(lugar, criaturasNaIlha = []) {
    const r = await painel(['Eles olham para vocês e para a névoa colorida em volta. Ninguém quer ficar sozinho aqui, mas ninguém diz isso em voz alta.',
      'São pessoas comuns, sem armas, e qualquer golpe derruba um deles. Junto do grupo, vão onde o grupo for — pela Poça e pelo labirinto, até o portal.'], [
      { rotulo: 'Levá-los com o grupo', valor: 'levar', primaria: true },
      { rotulo: 'Pedir que esperem aqui', valor: 'esperar' },
    ]);
    if (r === 'levar') {
      Refens.juntarAoGrupo(camp, lugar);
      for (const m of criaturasNaIlha) { const i = enc.combatants.indexOf(m); if (i >= 0) enc.combatants.splice(i, 1); }
      Refens.montarRefens(enc, camp, herois());
      darVoo();
      enc.say('acao', 'Os reféns vêm com o grupo, de mãos dadas, no meio da fila.');
    } else {
      Refens.esperarNaIlha(camp, lugar);
      enc.say('acao', 'Os reféns ficam esperando na ilha.');
    }
    app.refresh();
  }

  async function contaramNaCupula() {
    f.refensSoltos = true;
    v.refens = { ...(v.refens ?? {}), cupula: 'esperando' };
    const n = fragmentosDosFanaticos(camp);
    await painel(['Os quatro de Phandalin choram, riem e falam ao mesmo tempo. Aos poucos se entende:',
      '— Eram nove de nós. Os três devoradores trouxeram nove; havia mais, que ficaram pelo caminho. Depois de dias de testes, levaram os outros cinco.',
      '— Voaram para uma ilha com uma estátua enorme caída. A gente viu daqui.',
      `— Eles carregavam pedaços de pedra escura — diz o Wramble, o carpinteiro, que contou. — ${n}. Eram ${n}.`,
      'Pedem que vocês busquem os outros. Podem esperar aqui, se for preciso.']);
    pista(`Os presos da Cúpula: os fanáticos levaram outros cinco para a ilha da estátua tombada, e carregam ${n} pedaços do obelisco.`);
    await levarOuDeixar('cupula', P.refens.map((_, i) => elenco[`refem${i + 1}`]).filter(Boolean));
  }

  async function contaramNaEstatua(soltos) {
    f.gritou = true;
    if (soltos) v.refens = { ...(v.refens ?? {}), estatua: 'soltos' };
    await painel([soltos ? 'Quatro pessoas saem da base, magras, de dias sem comer: os irmãos Tartesh, escrivães, a inventora anã Nalpina Goldstone e a fazendeira orc Mildra Merkel.' : 'Pela fresta de dois dedos, vozes fracas respondem: quatro presos lá dentro.',
      '— Eles querem os nossos cérebros — diz o Hovnar, o irmão que ainda fala. — Para fazer um cérebro novo, quando o ritual acabar. O ritual é numa ilha que eles chamam Ânima de Ilvaash.',
      '— Abriram a boca da estátua com uma língua de metal, nos trancaram, fecharam e quebraram a língua.',
      '— Eu entendo um pouco da fala deles — diz a Nalpina. — Falaram em esconder a língua na nuvem venenosa.']);
    pista('Os presos da Estátua: os fanáticos querem os cérebros deles para um cérebro ancião novo, quando o ritual acabar, na Ânima de Ilvaash; a língua que abre a base foi escondida na nuvem venenosa.');
    if (soltos) await levarOuDeixar('estatua');
  }

  async function furarMembrana(c) {
    // a arma da mão, se for perfurante, com o atributo dela (o furo é um golpe preciso, não um ataque contra CA)
    const w = WEAPONS[c.equippedWeapon];
    if (!w || w.type !== 'perfurante') { await painel(`${c.name} não tem com que furar: o ponto pede uma arma perfurante na mão.`); return; }
    const mod = abilityMod(c.abilities?.[weaponAbility(c, w)] ?? 10);
    const dados = `${w.damage}${mod >= 0 ? '+' : ''}${mod}`;
    const d = damageRoll(enc.rng, dados);
    f.membranaPV = (f.membranaPV ?? 80) - d.total;
    if (f.membranaPV <= 0) return rasgarMembrana();
    if (d.total >= 10) { abrirABoca(`${c.name} fura o ponto certo (${d.total} perfurantes). A membrana relaxa com um suspiro, e lá longe, na boca, os dentes descem.`); return; }
    await painel(`${c.name} fura (${d.total}), raso demais. A membrana estremece; faltam ${f.membranaPV} para ela rasgar de vez.`);
  }

  async function rasgarMembrana() {
    f.membranaRasgada = true;
    const linhas = ['A membrana se rasga. O líquido de cérebro despenca garganta acima e o bicho inteiro se contrai: vomita tudo o que tem dentro.'];
    for (const h of herois()) {
      const sv = enc.resistencia(h, 'con', 18);
      const d = damageRoll(enc.rng, '12d10');
      const dano = sv.success ? Math.floor(d.total / 2) : d.total;
      enc.applyDamage(h, dano, 'ácido', null);
      if (h.hp <= 0) { h.dead = true; h.dissolvido = true; linhas.push(`${h.name} (Constituição ${sv.total}) leva ${dano} de ácido e se desfaz por inteiro.`); } else linhas.push(`${h.name} (Constituição ${sv.total}): ${dano} de ácido.`);
    }
    await painel(linhas);
    abrirABoca('A boca se abre de novo, escorrendo.');
    if (!herois().length) { estado.encerrado = true; app.encerrarPartida(); }
  }

  async function conversaDaNellik() {
    const r = await painel(['— Eu e nove mezzoloths servíamos uma arcanaloth que adora meter os outros em buraco — diz a Nellik. — Cansamos. Fugimos enquanto ela dormia, pela poça, que é onde ela não procuraria.',
      '— Agora estamos presos aqui. Daqui eu vejo as ilhas, esperando achar um jeito de sair que não passe pelo labirinto. Lá ela me espera.'], [
      { rotulo: 'Deixá-la', valor: 'sair', primaria: true },
      { rotulo: 'Atacar', valor: 'atacar' },
    ]);
    pista('A Nellik: fugiu da Ashripask com os mezzoloths pela poça, e quer sair do Vazio sem passar pelo labirinto.');
    if (r !== 'atacar') return;
    return lutarComANellik();
  }

  /** A luta no moinho: a Nellik e o Frevvik, e a trompa que chama as patrulhas. */
  function lutarComANellik() {
    // o Frevvik toca a trompa: os pares de patrulha que ainda andam chegam depois
    const patrulhas = [1, 2].map((j) => grupoDe(`patrulha${j}_`).filter((m) => m.side === 'neutro'));
    const chegam = {};
    let rodada = 1;
    for (const par of patrulhas) { if (!par.length) continue; rodada += enc.rng.die(4); chegam[rodada] = par; }
    // as patrulhas JÁ estão no tabuleiro (neutras, andando na fumaça): a trompa só as vira para a luta, sem pô-las de novo
    // o motor chama com o NÚMERO da rodada (`combat.js spawnReinforcements`)
    const reforcos = (rodada) => {
      const par = chegam[rodada];
      if (!par) return null;
      delete chegam[rodada];
      for (const m of par) if (vivo(m)) { m.side = 'foes'; (estado.lutando ??= []).push(m); }
      enc.say('acao', 'Pela fumaça, chegam mais dois mezzoloths, atendendo à trompa.');
      return null;
    };
    luta([elenco.nellik, elenco.frevvik].filter(vivo), { reforcos: Object.keys(chegam).length && vivo(elenco.frevvik) ? reforcos : null });
  }

  return {
    lugar: titulo,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) { c.movementLeftFt = MOVIMENTO; Refens.seguirOGrupo(enc, c); }
      return depoisDoPasso(c);
    },
    depoisDoPasso,
    fimDoCombate,
    evento,
    elenco,
    estado,
    ilha,
    viajar,
    descansar,
    async iniciar() {
      for (const m of Object.values(elenco)) if (!enc.combatants.includes(m)) enc.addCombatant(m);
      Refens.montarRefens(enc, camp, herois());
      darVoo();
      if (ilha === 'nematodeo') {
        // a boca nasce aberta (a FA a desenha fechada); fechada pela armadilha, só a membrana a reabre
        if (!f.bocaFechou || f.bocaAberta) for (const e of P.arestasDaBoca) enc.field.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.aberta);
        if (f.bocaFechou) for (const e of P.arestasDaTenda) enc.field.porAresta(e.a.x, e.a.y, e.b.x, e.b.y, ARESTA.aberta);
      }
      if (ilha === 'estatua' && f.baseAberta) for (const q of P.porta) enc.field.porAresta(q.a.x, q.a.y, q.b.x, q.b.y, ARESTA.aberta);
      if (ilha === 'anima' && f.obeliscoEmPo) enc.field.alternarSobreposicao?.('obeliscoQuebrado', true);
      if (ilha === 'campo') montarMoinho();
      if (ilha === 'anima') alturasDaAnima();
      if (ilha === 'miasma') {
        // a travessia até a ilhota: o grupo chega encostado nela
        const linhas = ['A névoa amarelo-esverdeada fecha em volta de vocês, grossa e amarga, por uns trinta metros de voo até um pedaço de chão no meio.'];
        atravessarNevoa(2, linhas);
        herois().forEach((h, i) => { const q = enc.casaLivreMaisProxima({ x: P.lingua.x + (i % 2 ? 1 : -1), y: P.lingua.y + (i > 1 ? 1 : -1) }); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; });
        f.chegou = true;
        await painel(linhas);
        if (!herois().length) { estado.encerrado = true; app.encerrarPartida(); return; }
      }
      if (!v.feito.chegouAoVazio) {
        v.feito.chegouAoVazio = true;
        await painel(['A estrela sem luz puxa por trás da cabeça, e o líquido some. Vocês estão de pé numa plataforma de pedra, num nada sem fim de cores que giram devagar, cheirando a metal queimado.',
          'Ilhas flutuam ao longe, cada uma com o seu "para cima". Basta pensar numa direção para ir até ela: aqui todos voam.']);
      }
      if (!v.visitadas.includes(ilha)) v.visitadas.push(ilha);
      if (!v.aVista.length) v.aVista = sortearAVista(enc.rng, ilha, v.visitadas);
      if (!f.chegou) {
        f.chegou = true;
        const ENTRADA = {
          ponte: 'Um rio escuro dá a volta na ilha como um anel. Uma ponte de pedra o atravessa até uma torre em ruínas, com luz de fogo na janela de cima.',
          charco: 'Árvores de musgo pendurado, um píer de pedra numa ponta, uma trilha que serpenteia, e uma névoa baixa que gira sem vento.',
          nematodeo: 'Não é ilha: é um bicho, um tubo de carne do tamanho de um castelo, adormecido, com uma caverna numa ponta e montes de musgo cor de ferrugem nas costas.',
          miasma: 'A névoa amarelo-esverdeada fecha em volta de vocês, grossa e amarga. Respirar arde. Em algum lugar no meio dela há chão.',
          estatua: 'Uma estátua de metal enorme, caída da base, cravada na ilha de cabeça. É um devorador de mentes de túnica — com uma boca humana debaixo dos tentáculos. Da base vêm marteladas fracas.',
          campo: 'Fumaça de enxofre sobre ruínas de uma batalha velha, uma pirâmide quebrada acima da fumaça e um moinho escuro cujas pás afastam a fumaça. Lamentos vêm de todo lado.',
          anima: ['Vocês miram na bacia de tentáculos, e ela os puxa: mire onde mirar, todos descem na mesma plataforma de pedra presa à borda, diante de uma escada larga.',
            'Tentáculos de pedra fazem arcos sobre tudo, e alguns ainda ondulam. Lá dentro há névoa, e na névoa, gritos.'],
        };
        if (ENTRADA[ilha]) await painel(ENTRADA[ilha]);
        if (ilha === 'charco' && f.nagasVoltaram) await painel('As nagas que vocês mataram estão de volta. Elas renascem.');
      }
      prepararExploracao();
    },
  };
}

/** Quem sai do Vazio deixa de voar (o voo era do Vazio). */
export function tirarVooDoVazio(lista) {
  for (const c of lista) if (c.vooDoVazio) { delete c.flyFt; delete c.hover; delete c.vooDoVazio; }
}
