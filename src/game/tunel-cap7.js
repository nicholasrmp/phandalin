// O TÚNEL DO CAPÍTULO 7 DO OBELISCO ("Journey through the Deep"): a descida do porão do Gigante Adormecido até os portões de
// Illithinoch, 12 milhas de túnel natural, em três cavernas sobre os battlemaps da FA (`tunel-cap7-mapas.js`, de
// `src/dev/mapa-tunel-cap7.py`) e a viagem entre elas.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - a VIAGEM: 12 milhas, cerca de 14 horas; vila -> cavernas dos grells 2 mi, -> toca do behir 3 mi, -> gruta tagarela
//     5 mi, -> Illithinoch 2 mi. A cada hora, um d20 na tabela do túnel (1 a 9, encontro; 10 a 20, nada). SE O GRUPO ANDA
//     COM LUZ, quem o encontra sabe que ele vem e arma emboscada; sem luz, ninguém surpreende ninguém. O túnel inteiro tem
//     luz fraca, de fungo (`mapa.luz` 1);
//   - J1, o rastro de sangue; J2, o ABISMO de 4,5 m por 9 m: escalar é Atletismo CD 12, e quem falha cai (3d6). No fundo,
//     o diário de Thorgran Ironquill, com o ex-libris de prata: quem cruza com Percepção passiva 14 vê o brilho, e quem
//     desce acha; J3, quatro grells, até a morte; J4, os três moradores que os grells guardaram para depois (Oskar
//     Ninebough e as irmãs Cathlette e Aida Camber), que querem escolta e vão sozinhos se o grupo tiver pressa;
//   - J5, a pedra queimada; J6, o BEHIR, vulnerável a psíquico: se não for atacado, pede em dracônico que o grupo expulse
//     os grells de J7; em luta, foge abaixo de 50 PV; o ninho guarda 7 penas de ouro, 1.520 po e a pomada de Keoghtom
//     (4 doses). J7, teto baixo: dois grells e o Vundru, o grell psíquico; os grells não entram na luta com o behir, e se o
//     grupo o MATA, decidem que quem mata um Grande Comedor vira Grande Comedor e vêm caçar o grupo, a não ser que ele os
//     interrompa entrando no recanto; a mochila do Thorgran, a escrita na parede e um cristal mental;
//   - J8, o borbulhar; J9, seis bocas tagarelas camufladas na lama: se o grupo RECUA sem matar todas, as que sobram se
//     fundem numa FUSÃO DE CARNE, que sai da lama na próxima vez que o grupo passar; J10, a capa negra mutante com o
//     esqueleto do Thorgran: no começo de cada turno, Sabedoria CD 12 (vantagem enquanto ouve as bocas de J9); falhou,
//     vira o Thorgran até o fim do turno (não anda, não ataca) e fala pela boca do morto; passou, delira em Comum.
//
// DECISÕES NOSSAS, ditas: os encontros da viagem acontecem na chegada à caverna seguinte, um depois do outro, com o bando
// a 6 a 9 m do grupo; o guincho dos cogumelos sempre chama outro encontro (1d8 na tabela); o teto baixo de J7 é terreno
// difícil (anda-se curvado); "muito barulho acorda o behir" não entra (o jogo não mede barulho).
//
// O estado mora em `app.campanha.obelisco7.tunel`.

import { narrar } from '../view/narrativa.js';
import { distanceFt } from '../core/grid.js';
import { damageRoll } from '../core/dice.js';
import { rolarPericia, SKILL_NAME, passivePerception } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition } from '../rules/conditions.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar } from './comercio.js';
import { PONTOS_TUNEL7 } from './tunel-cap7-mapas.js';

const MOVIMENTO = 60;
/** A variante de cada caverna, e a chave dos pontos. */
export const CAVERNAS = {
  tunelGrells: { chave: 'CAVERNAS_GRELLS', titulo: 'As cavernas dos grells' },
  tunelBehir: { chave: 'TOCA_BEHIR', titulo: 'A toca do behir' },
  tunelGruta: { chave: 'GRUTA_TAGARELA', titulo: 'A gruta tagarela' },
};
/** Os trechos da viagem: de onde a onde, milhas e horas (o livro: 12 milhas em cerca de 14 horas). */
export const TRECHOS = {
  vila: { proxima: 'tunelGrells', milhas: 2, horas: 2 },
  tunelGrells: { anterior: 'vila', proxima: 'tunelBehir', milhas: 3, horas: 4 },
  tunelBehir: { anterior: 'tunelGrells', proxima: 'tunelGruta', milhas: 5, horas: 6 },
  tunelGruta: { anterior: 'tunelBehir', proxima: 'illithinoch', milhas: 2, horas: 2 },
};
/** As horas entre duas paradas (indo ou voltando). */
export const horasEntre = (de, para) => (TRECHOS[de]?.proxima === para ? TRECHOS[de].horas : TRECHOS[para]?.proxima === de ? TRECHOS[para].horas : 0);

// ------------------------------------------------------------------------------------- a tabela do túnel ----
const dado = (rng, n) => rng.die(n);
const vezes = (id, n) => Array(n).fill(id);

/** O encontro do d20 (1 a 9), ou null (10 a 20). `extra`: o que o guincho dos cogumelos chama. */
export function encontroDaTabela(rng, d) {
  if (d <= 2) return { nome: 'grells caçando', elenco: vezes('grell', dado(rng, 4)) };
  if (d === 3) return { nome: 'bocas tagarelas à espreita', elenco: vezes('bocaTagarela', dado(rng, 6)) };
  if (d === 4) return { nome: 'um quaggoth que não é mais ele mesmo', elenco: ['quaggoth', 'devoradorDeIntelecto'] };
  if (d === 5) return { nome: 'um fomoriano perdido', elenco: ['fomoriano'] };
  if (d === 6) return { nome: 'horrores-gancho no teto', elenco: vezes('horrorGancho', dado(rng, 4) + 1) };
  if (d === 7) return { nome: 'quaggoths procurando um dos seus', elenco: ['quaggothThonot', ...vezes('quaggoth', dado(rng, 6))] };
  if (d === 8) return { nome: 'trogloditas e um barlgura procurando briga', elenco: ['barlgura', ...vezes('troglodita', dado(rng, 6))] };
  if (d === 9) {
    const guincho = encontroDaTabela(rng, dado(rng, 8));
    return { nome: 'cogumelos guinchadores fechando o caminho', elenco: vezes('cogumeloGuinchador', dado(rng, 4) + dado(rng, 4)), chama: guincho };
  }
  return null;
}

/** A viagem de `horas` horas: um d20 por hora. Devolve os encontros, na ordem, com a hora de cada um. */
export function rolarViagem(rng, horas) {
  const out = [];
  for (let h = 1; h <= horas; h++) {
    const d = dado(rng, 20);
    const e = encontroDaTabela(rng, d);
    if (!e) continue;
    out.push({ hora: h, d20: d, nome: e.nome, elenco: e.elenco });
    if (e.chama) out.push({ hora: h, d20: d, nome: `o guincho chama ${e.chama.nome}`, elenco: e.chama.elenco });
  }
  return out;
}

// --------------------------------------------------------------------------------------------- a cena ----
export function criarTunel7(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  // pela campanha a caverna vem em `cenaDaVila`; pelo atalho `?encontro=`, em `variante`
  const qual = config.cenaDaVila ?? config.variante;
  const { chave, titulo } = CAVERNAS[qual];
  const P = PONTOS_TUNEL7[chave];
  const camp = (app.campanha ??= {});
  const o7 = (camp.obelisco7 ??= { feito: {}, lutas: {} });
  o7.feito ??= {};
  const t = (o7.tunel ??= { feito: {}, mortos: [], horas: 0 });
  t.feito ??= {};
  t.mortos ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null, filaDeEncontros: [...(config.encontros ?? [])], aleatorio: false };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); enc.say('acao', `Pista: ${txt}`); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const naSala = (sala, p) => (P.salas[sala] ?? []).some((q) => q.x === p.x && q.y === p.y);
  const aqui = (pts, tile) => [].concat(pts ?? []).some((q) => q.x === tile.x && q.y === tile.y);
  const vivo = (f) => f && !f.dead && f.hp > 0 && !f.fugiu;

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  const criar = (k, id, pos, nome) => {
    if (t.mortos.includes(`${qual}:${k}`)) return null;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDoTunel = k;
    m.side = 'neutro';
    elenco[k] = m;
    return m;
  };
  if (qual === 'tunelGrells') {
    P.grells.forEach((p, i) => criar(`grell${i + 1}`, 'grell', p));
    if (!t.feito.presosSairam) {
      ['Oskar Ninebough', 'Cathlette Camber', 'Aida Camber'].forEach((nome, i) => {
        const m = criar(`preso${i + 1}`, 'plebeu', P.presos[i], nome);
        m.hp = Math.max(1, Math.floor(m.maxHp / 3));
        m.preso = true;
      });
    }
  }
  if (qual === 'tunelBehir') {
    const b = criar('behir', 'behir', P.behir);
    // o livro: o cérebro ancião mudou o behir, que ficou VULNERÁVEL A PSÍQUICO
    if (b) { b.vulnerable = [...(b.vulnerable ?? []), 'psíquico']; b.casasPermitidas = new Set([...P.salas.J6, ...P.salas.J5, ...P.salas.tunel].map((q) => `${q.x},${q.y}`)); }
    P.grells.forEach((p, i) => criar(`grell${i + 1}`, 'grell', p));
    criar('vundru', 'grellPsiquico', P.vundru, 'Vundru');
  }
  if (qual === 'tunelGruta') {
    if (!t.feito.bocasNaLama) P.bocas.forEach((p, i) => criar(`boca${i + 1}`, 'bocaTagarela', p));
    const m = criar('mutante', 'capaNegraMutante', P.mutante);
    if (m) prepararMutante(m);
  }
  const grupoDe = (...ks) => ks.map((k) => elenco[k]).filter((m) => m && !m.dead);
  const grellsDe = () => Object.entries(elenco).filter(([k]) => /^grell|^vundru/.test(k)).map(([, m]) => m).filter((m) => !m.dead);
  const bocasVivas = () => Object.entries(elenco).filter(([k]) => /^boca/.test(k)).map(([, m]) => m).filter(vivo);

  // ---------------------------------------------------- a capa negra mutante ----
  // Os delírios e as falas do Thorgran: cada turno, a próxima da lista.
  function prepararMutante(m) {
    let delirio = 0;
    let thorgran = 0;
    const DELIRIOS = [
      'O Reino Distante dá, e dá, e dá! Vocês não sentem? Tudo fica MAIOR!',
      'Um império vai se erguer de novo debaixo dos seus pés, maior que o primeiro.',
      'As pedras mágicas lá de cima vão alimentar a piscina. E os cérebros. Os cérebros alimentam a piscina.',
      'E os presos? Para que servem os presos? Ninguém me disse para que servem os presos...',
      'Ilvaash se ergue! Ilvaash se ergue! — e, mais baixo, como quem pergunta: — quem é Ilvaash?',
    ];
    const THORGRAN = [
      'Eu me enterrei de mentira, sabem? Uma lápide, umas flores. Ninguém segue um morto.',
      'Cheguei perto. Perto demais da fortaleza. Foi lá que morri de verdade.',
      'Avisem a Encruzilhada da Forca. Os de tentáculos vão marchar contra eles.',
      'Um general deles, de manto escarlate e gola alta, Oshundo, junta forças contra Talhundereth. Avisem os sacerdotes.',
    ];
    m.testeNoInicio = {
      save: 'wis', dc: 12, nome: 'a lembrança de quem era',
      // o livro: vantagem enquanto ele ouve o borbulhar das bocas de J9
      vantagem: () => bocasVivas().length > 0 || Boolean(t.feito.bocasNaLama),
      falha: 'para de se mexer: o cadáver pendurado na boca dele levanta a cabeça, e quem fala é o Thorgran',
      aoFalhar: (e) => {
        e.say('fala', `O esqueleto do anão: — ${THORGRAN[thorgran % THORGRAN.length]}`);
        thorgran += 1;
        t.feito.thorgranFalou = true;
      },
      aoPassar: (e) => { e.say('fala', `Na cabeça de todos, uma voz molhada: — ${DELIRIOS[delirio % DELIRIOS.length]}`); delirio += 1; },
    };
  }

  // -------------------------------------------------------- explorar e lutar ----
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

  function luta(quem, { furtividade = null } = {}) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = furtividade ? { emboscadores: 'foes', furtividade } : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista, motivo) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.fugiu).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${motivo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(todos());
  }

  /** Onde o bando de um encontro da viagem aparece: casas livres a 6 a 9 m do grupo, à vista. */
  function casasDoBando(elencoIds) {
    const de = herois()[0]?.pos ?? P.grupo[0];
    const alc = enc.field.reachable({ x: de.x, y: de.y }, 100000, () => false);
    const cands = [...alc.values()].map((n) => ({ x: n.x, y: n.y, d: distanceFt(de, n) }))
      .filter((q) => q.d >= 20 && q.d <= 45 && enc.field.hasLineOfSight(de, q)).sort((a, b) => a.d - b.d);
    const usadas = [];
    const livre = (x, y, f) => {
      for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) {
        const X = x + dx;
        const Y = y + dy;
        if (!enc.field.inside(X, Y) || enc.field.blocksMove(X, Y) || enc.occupied(X, Y) || usadas.includes(`${X},${Y}`)) return false;
      }
      return true;
    };
    return elencoIds.map((id) => {
      const f = makeMonster(id, { x: 0, y: 0 });
      const lado = f.pos?.f ?? 1;
      const q = cands.find((c) => livre(c.x, c.y, lado)) ?? cands[0] ?? de;
      for (let dy = 0; dy < lado; dy++) for (let dx = 0; dx < lado; dx++) usadas.push(`${q.x + dx},${q.y + dy}`);
      f.pos = { ...f.pos, x: q.x, y: q.y };
      f.facingVec = { dx: Math.sign(de.x - q.x), dy: Math.sign(de.y - q.y) };
      return f;
    });
  }

  /** O próximo encontro da viagem, se houver. Devolve true se uma luta começou. */
  async function proximoEncontro() {
    const e = estado.filaDeEncontros.shift();
    if (!e) return false;
    const bando = casasDoBando(e.elenco);
    const comLuz = t.luz;
    await painel([`Na ${e.hora}ª hora de caminhada: ${e.nome}.`,
      comLuz ? 'A luz de vocês os avisou de longe: eles esperavam no escuro.' : 'Sem luz, os dois lados se veem ao mesmo tempo, na luz fraca do fungo.'],
    [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
    estado.aleatorio = true;
    luta(bando, { furtividade: comLuz ? bando.map((f) => rolarPericia(enc.rng, f, 'furtividade').total) : null });
    return true;
  }

  // ------------------------------------------------------------- os gatilhos ----
  async function depoisDoPasso(c) {
    // J9: recuar sem matar todas as bocas (fora do poço e a mais de 4,5 m de todas, mais que o passo de 3 m delas) encerra
    // a luta, e as que sobram se fundem
    if (qual === 'tunelGruta' && estado.lutando && bocasVivas().length && estado.lutando.some((f) => /^boca/.test(f.chaveDoTunel ?? ''))) {
      const vivos = herois();
      const longeDeTodas = vivos.every((h) => !naSala('J9', h.pos) && bocasVivas().every((b) => distanceFt(h.pos, b.pos) > 15));
      if (vivos.length && longeDeTodas) {
        const n = bocasVivas().length;
        for (const b of bocasVivas()) { enc.combatants.splice(enc.combatants.indexOf(b), 1); b.naLama = true; }
        t.feito.bocasNaLama = n;
        for (const k of Object.keys(elenco)) if (/^boca/.test(k)) delete elenco[k];
        await painel([`As ${n > 1 ? `${n} bocas que sobraram afundam` : 'boca que sobrou afunda'} de volta na lama, borbulhando.`,
          'Por um instante, a lama inteira do poço estremece, como se alguma coisa grande se ajeitasse lá embaixo.']);
        prepararExploracao();
        return true;
      }
    }
    if (!estado.explorando) return false;
    const hs = herois();
    const ve = (m, pes) => hs.find((h) => distanceFt(h.pos, m.pos) <= pes && enc.field.hasLineOfSight(h.pos, m.pos));
    const em = (sala) => hs.find((h) => naSala(sala, h.pos));

    if (qual === 'tunelGrells') {
      if (em('J1') && !t.feito.j1) {
        t.feito.j1 = true;
        await painel('No cruzamento, quatro goblins mortos, roídos até o osso, e um rastro de sangue que entra pela passagem lateral, para o sul.');
      }
      const grells = grupoDe('grell1', 'grell2', 'grell3', 'grell4');
      if (grells.length && grells.every((g) => g.side !== 'foes') && (em('J3') || grells.some((g) => ve(g, 30)))) {
        await painel('Do alto do salão, entre as estalactites quebradas, quatro coisas se soltam do teto: cérebros do tamanho de um homem, com bico e tentáculos, que descem flutuando.',
          [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(grells);
      }
    }
    if (qual === 'tunelBehir') {
      const b = elenco.behir;
      const grells7 = grupoDe('grell1', 'grell2', 'vundru');
      // os grells de J7: quem entra no recanto deles é presa
      if (grells7.length && grells7.every((g) => g.side !== 'foes') && em('J7')) {
        await painel('O recanto tem o teto tão baixo que vocês andam curvados. No fundo, três cérebros com bico viram para vocês ao mesmo tempo; um deles, maior, tem os olhos acesos de roxo.',
          [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(grells7);
      }
      // o behir: se ninguém o ataca, ele fala
      if (vivo(b) && b.side !== 'foes' && !t.feito.behirFalou && (em('J6') || ve(b, 20))) {
        t.feito.behirFalou = true;
        const entende = hs.some((h) => /dracon/i.test(`${h.ancestry ?? ''} ${h.raca ?? ''} ${(h.idiomas ?? []).join(' ')}`));
        const r = await painel([
          'No ninho, uma serpente azul de doze patas, comprida como uma carroça e meia, levanta a cabeça devagar. Faíscas correm pelas escamas.',
          entende
            ? 'Ela fala em dracônico, numa voz de trovão abafado: — Pequenos. Os comedores de cérebro que voam moram lá em cima, no buraco onde eu não caibo. Comem a minha caça. Tirem-nos de lá, e eu deixo vocês passarem.'
            : 'Ela sibila numa língua de lagarto, aponta com o focinho o buraco no alto da parede, e repete a mesma palavra, mais alto. Parece um pedido, não uma ameaça. Por enquanto.',
        ], [
          { rotulo: 'Aceitar: tirar os grells do recanto', valor: 'aceitar', primaria: true },
          { rotulo: 'Atacar o behir', valor: 'atacar' },
          { rotulo: 'Recuar devagar', valor: 'recuar' },
        ]);
        if (r === 'atacar') return luta([b]);
        if (r === 'aceitar') { t.feito.behirPacto = true; pista('O behir deixa o grupo passar se ele tirar os grells do recanto de cima (J7).'); }
        return false;
      }
      // morto o behir, os grells decidem caçar quem matou o Grande Comedor, a não ser que o grupo entre antes no recanto
      if (t.feito.behirMorto && grells7.length && grells7.every((g) => g.side !== 'foes') && (t.grellsDecidem ?? 0) > 0) {
        t.grellsDecidem -= 1;
        if (t.grellsDecidem === 0) {
          const boca = P.salas.J7.find((q) => q.y === 5) ?? P.vundru;
          for (const g of grells7) { const q = enc.casaLivreMaisProxima({ x: boca.x, y: boca.y }); if (q) g.pos = { ...g.pos, x: q.x, y: q.y }; }
          await painel('Do buraco no alto da parede, três vultos saem flutuando, um atrás do outro. O de olhos roxos vem na frente: quem matou o Grande Comedor é o novo Grande Comedor, e ele quer o título.',
            [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
          return luta(grells7);
        }
      }
    }
    if (qual === 'tunelGruta') {
      // a fusão de carne: as bocas que sobraram saem da lama, juntas, quando o grupo passa de novo
      if (t.feito.bocasNaLama && !t.feito.fusao && (em('J9') || em('J8'))) {
        t.feito.fusao = true;
        const f = makeMonster('fusaoDeCarne', { x: 7, y: 3 });
        const q = enc.casaLivreMaisProxima({ x: 7, y: 3, f: 3 });
        if (q) f.pos = { ...f.pos, x: q.x, y: q.y };
        f.chaveDoTunel = 'fusao';
        elenco.fusao = f;
        await painel('A lama do poço sobe numa onda. Do meio dela sai uma montanha de carne coberta de bocas e olhos, as bocas de antes todas costuradas numa só, e tudo nela fala ao mesmo tempo.',
          [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta([f]);
      }
      const bocas = bocasVivas().filter((b) => b.side !== 'foes');
      if (bocas.length && em('J9')) {
        await painel('Uma das bolotas de carne pisca. Depois outra. A lama inteira do poço começa a falar, em seis bocas, sem palavra nenhuma.',
          [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        for (const b of bocas) if (!enc.combatants.includes(b)) enc.addCombatant(b);
        return luta(bocas);
      }
      const m = elenco.mutante;
      if (vivo(m) && m.side !== 'foes' && (em('J10') || ve(m, 30))) {
        await painel(['Entre as pedras dobradas em gancho, uma capa negra enorme se desdobra do teto. Pendurado na boca dela, como um boneco, o esqueleto de um anão de barba trançada, ainda com o cinto de pena e tinteiro.',
          'O esqueleto levanta a mão e acena para vocês.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta([m]);
      }
    }
    return false;
  }

  // --------------------------------------------------------------- o evento ----
  function evento(ev) {
    // o BEHIR foge abaixo de 50 PV, e abandona o lugar
    if (ev.type === 'damage' && ev.target === elenco.behir && vivo(ev.target) && ev.target.hp < 50) {
      const b = ev.target;
      b.fugiu = true;
      const i = enc.combatants.indexOf(b);
      if (i >= 0) enc.combatants.splice(i, 1);
      t.feito.behirFugiu = true;
      enc.say('acao', `${b.name} solta um ronco de trovão e foge pelo túnel do sul, arrastando a cauda. Não volta mais.`);
      enc.checkEnd();
      app.refresh();
    }
  }

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo, texto: ['O túnel engole o grupo. Lá em cima, no Gigante Adormecido, a Greska deixa uma vela acesa no porão por muitas noites.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const f of lutou) if (f.dead && f.chaveDoTunel) t.mortos.push(`${qual}:${f.chaveDoTunel}`);
    await darXpDe(lutou, estado.aleatorio ? 'O encontro do túnel' : titulo);
    if (estado.aleatorio) {
      estado.aleatorio = false;
      for (const f of lutou) { const i = enc.combatants.indexOf(f); if (f.dead && i >= 0) enc.combatants.splice(i, 1); }
      if (await proximoEncontro()) return;
      prepararExploracao();
      return;
    }
    if (lutou.includes(elenco.behir)) {
      if (elenco.behir.dead) { t.feito.behirMorto = true; t.grellsDecidem = 3; }
      await painel(t.feito.behirFugiu ? 'O ninho fica para vocês, com o cheiro de tempestade ainda no ar.' : 'O behir desaba no próprio ninho, e as faíscas morrem nas escamas.');
      if (t.feito.behirMorto && grupoDe('grell1', 'grell2', 'vundru').length) {
        await painel('Do buraco no alto da parede vem um cochicho úmido, em grell, que não para. Os de cima estão discutindo alguma coisa.');
      }
    }
    if (lutou.includes(elenco.vundru) && t.feito.behirPacto && vivo(elenco.behir)) {
      await painel('Do ninho vem um ronco satisfeito. O behir apoia de novo a cabeça nas patas e fecha os olhos: o caminho é de vocês.');
    }
    if (lutou.includes(elenco.mutante) && elenco.mutante.dead) {
      pista('O Thorgran Ironquill, historiador anão, fingiu a própria morte para espionar Illithinoch e morreu de verdade perto dela. A capa mutante usava o cadáver dele.');
      if (t.feito.thorgranFalou) pista('Pela boca do Thorgran morto: avisar a Encruzilhada da Forca; um general dos devoradores, de manto escarlate, chamado Oshundo, junta forças contra Talhundereth.');
    }
    prepararExploracao();
  }

  // ------------------------------------------------- as conversas de J4 ----
  const arvorePresos = () => ({
    inicio: 'oi',
    nos: {
      oi: {
        narra: 'Três pessoas encolhidas no canto da despensa, sujas de sangue seco que não é delas. Um homem de perna torta e duas mulheres de ombros largos de mineira, com as roupas meio desfeitas: estavam trançando uma corda.',
        fala: 'Vocês são de verdade? — O homem segura a mão de uma delas. — Oskar Ninebough, serrador. Esta é a Cathlette, minha noiva, e a Aida, a irmã dela. Somos de Phandalin.',
        opcoes: [
          { texto: 'O que aconteceu?', vai: 'historia' },
          { texto: 'Nós levamos vocês para casa.', fim: 'escoltar' },
          { texto: 'A vila fica a duas milhas, subindo. Vão pela beira do abismo, devagar.', fim: 'sozinhos' },
        ],
      },
      historia: {
        fala: 'Goblins, de olhos acesos. Pegaram um monte de gente na vila e trouxeram por este túnel. Eu atrasava a fila, por causa da perna, e elas ficaram comigo. Aí aquelas coisas voadoras desceram do teto, comeram os goblins da retaguarda e nos trouxeram para cá. Para depois, entendem? Estão de barriga cheia. Faz dois dias.',
        opcoes: [{ texto: '…', vai: 'oi' }],
      },
    },
  });

  async function depoisDaConversa(npc, fim) {
    if (!npc?.preso || !['escoltar', 'sozinhos'].includes(fim)) return null;
    t.feito.presosSairam = true;
    o7.resgatados = ['oskar', 'cathlette', 'aida'];
    for (const k of ['preso1', 'preso2', 'preso3']) { const m = elenco[k]; const i = enc.combatants.indexOf(m); if (i >= 0) enc.combatants.splice(i, 1); }
    if (fim === 'escoltar') {
      await painel(['A subida leva duas horas, com o Oskar apoiado em dois ombros. No porão do Gigante, a Greska põe os três sentados perto do fogo, com sopa e cobertor, e manda um menino correr para avisar as famílias.',
        'Quando vocês voltam ao buraco, a Cathlette ainda está chorando de rir.']);
      t.horas += 4;
      sair((v) => app.irParaVila(v));
      return 'sai';
    }
    await painel('A Aida pega a corda pela metade que trançaram e ajuda o Oskar a se levantar. — A gente consegue. Vão. — E os três somem devagar pela passagem, de mãos dadas.');
    app.refresh();
    return 'sai';
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const trecho = TRECHOS[qual];
    // AS SAÍDAS: o túnel continua (com a viagem entre uma caverna e a outra), ou volta
    if (aqui(P.saida, tile)) {
      ops.push({ rotulo: trecho.proxima === 'illithinoch' ? 'Seguir até Illithinoch' : 'Seguir pelo túnel', icone: 'acao-disparada',
        detalhe: `${trecho.milhas} milhas, umas ${trecho.horas} horas`, motivo: longe(c, tile), fazer: () => viajar(trecho.proxima, 'entrada') });
    }
    if (aqui(P.entrada, tile)) {
      const volta = trecho.anterior;
      ops.push({ rotulo: volta === 'vila' ? 'Subir de volta à vila' : 'Voltar pelo túnel', icone: 'acao-disparada',
        detalhe: `${horasEntre(volta, qual)} horas`, motivo: longe(c, tile), fazer: () => viajar(volta, 'saida') });
    }
    if (qual === 'tunelGrells') {
      const borda = aqui(P.abismoNorte, tile) ? P.abismoSul : aqui(P.abismoSul, tile) ? P.abismoNorte : null;
      if (borda) {
        ops.push({ rotulo: 'Atravessar o abismo', icone: 'acao-disparada', detalhe: 'Atletismo CD 12, cada um', motivo: longe(c, tile), fazer: () => atravessar(borda) });
        if (!t.feito.diario) ops.push({ rotulo: 'Descer ao fundo do abismo', icone: 'acao-procurar', detalhe: 'Atletismo CD 12', motivo: longe(c, tile), fazer: () => descerAoFundo(c) });
      }
    }
    if (qual === 'tunelBehir') {
      if (aqui(P.ninho, tile) && !vivo(elenco.behir) && !t.feito.ninho) {
        ops.push({ rotulo: 'Revirar o ninho', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          t.feito.ninho = true;
          guardar(c, 'penaDeOuro', 7);
          guardar(c, 'moedaDeOuro', 1520);
          guardar(c, 'pomadaDeKeoghtom', 4);
          await painel(`Entre pedra moída e osso queimado: sete penas de escrever de ouro, mil quinhentas e vinte peças de ouro espalhadas e um pote de barro com quatro doses de pomada de Keoghtom. ${c.name} guarda tudo.`);
          app.refresh();
        } });
      }
      if (aqui(P.mochila, tile) && !t.feito.mochila && !grupoDe('grell1', 'grell2', 'vundru').some(vivo)) {
        ops.push({ rotulo: 'Examinar a mochila', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          t.feito.mochila = true;
          guardar(c, 'cristalMentalCuidadoso', 1);
          await painel(['Dentro da mochila mofada, só retalhos de couro e um cristal claro, morno ao toque. Mas atrás dela, na parede leste que ela protegeu da umidade, sobrou um pedaço de escrita a carvão, em anão:',
            '"…a fortaleza fica sete milhas abaixo… cuidado com a atenção do cérebro, ele sente todos… um general importante, Oshundo, manto escarlate de gola alta… talvez marchem contra a Encruzilhada… roubei um dos cristais deles, os sacerdotes de Talhundereth vão querer ver…"']);
          pista('A escrita do Thorgran no recanto do behir: a fortaleza fica bem abaixo; o cérebro ancião sente quem se aproxima; um general chamado Oshundo, de manto escarlate; os devoradores talvez marchem contra a Encruzilhada da Forca.');
          app.refresh();
        } });
      }
    }
    return ops;
  }

  async function atravessar(borda) {
    const linhas = [];
    const passiva = Math.max(...herois().map((h) => passivePerception(h)));
    for (const h of herois()) {
      const r = rolarPericia(enc.rng, h, 'atletismo');
      if (r.total >= 12) { linhas.push(`${h.name} (${SKILL_NAME.atletismo} ${r.total}) desce e sobe sem escorregar.`); }
      else {
        const d = damageRoll(enc.rng, '3d6');
        enc.applyDamage(h, d.total, 'concussão', null);
        linhas.push(`${h.name} (${SKILL_NAME.atletismo} ${r.total}) escorrega e cai os nove metros: ${d.total} de dano. Sobe de novo devagar.`);
      }
      const q = enc.casaLivreMaisProxima({ x: borda.x, y: borda.y });
      if (q) h.pos = { ...h.pos, x: q.x, y: q.y };
    }
    if (!t.feito.diario && !t.feito.brilhoVisto && passiva >= 14) {
      t.feito.brilhoVisto = true;
      linhas.push('Lá embaixo, no fundo do abismo, alguma coisa de prata pega a pouca luz e brilha.');
    }
    await painel(linhas);
    app.refresh();
  }

  async function descerAoFundo(c) {
    const r = rolarPericia(enc.rng, c, 'atletismo');
    const linhas = [];
    if (r.total < 12) {
      const d = damageRoll(enc.rng, '3d6');
      enc.applyDamage(c, d.total, 'concussão', null);
      linhas.push(`${c.name} (${SKILL_NAME.atletismo} ${r.total}) escorrega no meio da descida e cai: ${d.total} de dano.`);
    } else linhas.push(`${c.name} (${SKILL_NAME.atletismo} ${r.total}) desce de pedra em pedra até o fundo.`);
    if (!c.dead && c.hp > 0) {
      t.feito.diario = true;
      guardar(c, 'diarioDeThorgran', 1);
      linhas.push('No fundo, entre ossos de goblin, um livro de capa de couro inchada, com uma placa de prata gravada: "Thorgran Ironquill, historiador". Sobraram poucas páginas: boatos de devoradores de mentes debaixo das Montanhas da Espada, o plano de espionar Illithinoch, e a intenção de avisar os anões, os de Talhundereth entre eles.');
      pista('O diário de Thorgran Ironquill, no fundo do abismo: o historiador anão que "morreu" foi espionar Illithinoch. A placa de prata vale 450 po; com as páginas, a Gwyn acharia quem pagasse o dobro.');
    }
    await painel(linhas);
    app.refresh();
  }

  /** A VIAGEM até a próxima parada (ou a anterior): rola os encontros das horas do trecho e abre a cena de lá. */
  async function viajar(para, chegada) {
    const horas = horasEntre(qual, para);
    t.horas += horas;
    if (para === 'vila') {
      await painel(`Duas horas de subida, e a rampa em espiral acaba no porão do Gigante Adormecido.`);
      sair((v) => app.irParaVila(v));
      return;
    }
    const encontros = rolarViagem(enc.rng, horas);
    await painel([`${horas} horas de túnel, descendo sempre, na luz fraca do fungo${t.luz ? ' e das tochas' : ''}.`,
      encontros.length ? `No caminho, ${encontros.length > 1 ? `${encontros.length} encontros` : 'um encontro'}.` : 'Nada no caminho além de pingos d\'água e do eco dos próprios passos.']);
    sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: para, chegada, encontros, continuarCom: v }));
  }

  return {
    lugar: titulo,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso(c);
    },
    fimDoCombate,
    evento,
    dialogoDe: (npc) => (npc?.preso ? arvorePresos() : null),
    depoisDaConversa,
    elenco,
    estado,
    proximoEncontro,
    async iniciar() {
      // NA PRIMEIRA DESCIDA: com luz ou sem (o livro: com luz, quem acha o grupo arma emboscada)
      if (t.luz == null) {
        const r = await painel(['A rampa em espiral desce do porão e vira túnel: pedra natural, teto de três a quatro metros, e um fungo pálido nas paredes que dá uma luz fraca e doente, o bastante para não tropeçar.',
          'Acender tochas deixa ver mais longe. E deixa quem vive aqui embaixo ver vocês chegando.'], [
          { rotulo: 'Seguir na luz do fungo', valor: 'escuro', primaria: true },
          { rotulo: 'Acender as tochas', valor: 'luz' },
        ]);
        t.luz = r === 'luz';
      }
      // quem chega pela saída (voltando pelo túnel) aparece do lado de lá
      if (config.chegada === 'saida') {
        for (const h of herois()) { const q = enc.casaLivreMaisProxima({ x: P.saida[0].x, y: P.saida[0].y }); if (q) h.pos = { ...h.pos, x: q.x, y: q.y }; }
      }
      for (const m of Object.values(elenco)) {
        // as bocas estão na lama (fora do tabuleiro até alguém pisar no poço), o resto à vista
        if (/^boca/.test(m.chaveDoTunel)) continue;
        if (!enc.combatants.includes(m)) enc.addCombatant(m);
      }
      if (!t.feito[`visto:${qual}`]) {
        t.feito[`visto:${qual}`] = true;
        await painel({
          tunelGrells: 'Duas milhas abaixo da vila, o túnel se abre num emaranhado de cavernas. O ar cheira a sangue velho.',
          tunelBehir: 'Mais três milhas, e a pedra muda: lisa, raspada, com listras queimadas, como depois de uma tempestade presa debaixo da terra.',
          tunelGruta: 'Cinco milhas adiante, o fungo das paredes muda de cor sozinho, e de algum lugar à frente vem um borbulhar, sem palavras.',
        }[qual]);
      }
      if (await proximoEncontro()) return;
      prepararExploracao();
    },
  };
}
