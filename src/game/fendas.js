// AS TRÊS FENDAS DE ILLITHINOCH (o Obelisco, capítulo 7): pedaços do Reino Distante atrás dos rasgos de X4, X5 e X10,
// sobre os battlemaps da FA (`fendas-mapas.js`, de `src/dev/mapa-fendas.py`). Em cada uma, a runa que os fanáticos
// puseram para escorar o portal de X16, e o GNAWBLE que nasce dela: os três, levados ao nicho, reabrem o portal.
//
// O QUE É DO LIVRO (as regras; o texto é nosso):
//   - A EXPOSIÇÃO: na primeira vez que um herói entra numa fenda, Constituição CD 12 ou envenenado por uma hora; depois o
//     corpo se acostuma àquela fenda. Entrar numa fenda rompe o vínculo psíquico do cérebro ancião. Não há norte: as
//     direções são "de onde se veio". A pedra ferida sangra icor cinza;
//   - O GNAWBLE: a bola de pelo com boca que pende da runa; colhida, vira criatura (aqui, um item que morde quem o
//     carrega), e renasce um dia depois. Aqui: colhe-se de novo quando ninguém do grupo tem o daquela fenda;
//   - AS TRINCHEIRAS: os três grells do refeitório comum atacam quem não é grell; a Naruv e o outro grell do refeitório
//     privado também, furiosos; a gosma das calhas alimenta, mas mais de um gole é Constituição CD 12 ou envenenado por
//     10 minutos; o baú no fundo da bacia (a tiara de prata e o cristal acelerado); o Bashudu, o nothic que ainda vive
//     num tanque, conta da traição e morre; MEXER nos nothics ou na gosma dos tanques muda o gosto: os grells de F3 vêm
//     na hora, e os de F2 dão a volta pela caverna e chegam pouco depois;
//   - O OCO DA DESOVA: os dois glifos (5d8 trovejante a quem está a 6 m, Destreza CD 12 metade), achados com Investigação
//     CD 12; disparado, o Chalaag vem invisível ver o que foi; os doze girinos e o slaad vermelho do funil; o Chalaag na
//     câmara do vórtice; o vórtice, que leva quem entra por 2d6 horas e devolve no redemoinho;
//   - O LABIRINTO DOS OLHOS: a ESFERA QUE ROLA (`esfera`): gira de fora, e troca os túneis (as duas configurações da cena
//     do Foundry); a ocular (Enfraquecer o Intelecto, Inteligência CD 18, e o que ela mostra da Piscina Salobra; um golpe
//     a quebra); o ladrão morto armadilhado (Investigação CD 13 entende, Prestidigitação ou Religião CD 15 desarma; quem
//     mexe sem desarmar solta 5d8 necrótico, Constituição CD 15 metade, a 4,5 m); o Golcuus no covil, até a morte; e,
//     se ninguém o enfrentou, ele vem interceptar quem colhe o gnawble.
//
// DECISÕES NOSSAS, ditas: a iniciativa com desvantagem do Chalaag absorto não entra (a iniciativa aqui é por lado); a
// passagem alta de F3 para F4 não pede escalada, porque a planta da FA liga F4 pelo corredor; o vórtice devolve o herói no
// redemoinho na hora (o tempo de fora não se conta aqui).
//
// O estado mora em `app.campanha.obelisco7.fendas`.

import { narrar } from '../view/narrativa.js';
import { distanceFt, ARESTA } from '../core/grid.js';
import { damageRoll } from '../core/dice.js';
import { rolarPericia, SKILL_NAME, skillBonus } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { hasCondition, addCondition, removeCondition } from '../rules/conditions.js';
import { garantirInventario } from '../rules/equipment.js';
import { darXp } from './nivel.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { guardar } from './comercio.js';
import { PONTOS_FENDAS } from './fendas-mapas.js';

const MOVIMENTO = 60;
export const FENDAS = {
  fendaTrincheiras: { chave: 'TRINCHEIRAS', titulo: 'As Trincheiras de Alimentação', gnawble: 'gnawbleTrincheiras',
    sensacao: 'Uma fome que não passa, por mais que se coma.' },
  fendaOco: { chave: 'OCO_DA_DESOVA', titulo: 'O Oco da Desova', gnawble: 'gnawbleOco',
    sensacao: 'A sensação de que a pele desliza devagar por cima dos músculos.' },
  fendaLabirinto: { chave: 'LABIRINTO_DOS_OLHOS', titulo: 'O Labirinto dos Olhos', gnawble: 'gnawbleLabirinto',
    sensacao: 'A certeza de estar sendo olhado, de todos os lados, o tempo todo.' },
};
/** O centro e o raio da esfera do Labirinto (o anel), em casas. */
const ESFERA = { x: 27, y: 17, raio: 7 };

export function criarFenda(app, config = {}) {
  const enc = app.enc;
  const root = app.root;
  const qual = config.cenaDaVila ?? config.variante;
  const F = FENDAS[qual];
  const P = PONTOS_FENDAS[F.chave];
  const camp = (app.campanha ??= {});
  const o7 = (camp.obelisco7 ??= { feito: {}, lutas: {} });
  const fs = (o7.fendas ??= {});
  const t = (fs[qual] ??= { feito: {}, mortos: [], expostos: [] });
  t.feito ??= {};
  t.mortos ??= [];
  t.expostos ??= [];
  const vila = (camp.vila ??= { pistas: [], missoes: {} });
  const estado = { explorando: false, encerrado: false, lutando: null, passosDoAlarme: null };
  const todos = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead);
  const herois = () => todos().filter((c) => c.hp > 0);
  const painel = (texto, escolhas) => narrar(root, { formato: 'painel', paginas: [{ titulo: F.titulo, texto: [].concat(texto) }], ...(escolhas ? { escolhas } : {}) });
  const pista = (txt) => { if (!(vila.pistas ??= []).includes(txt)) vila.pistas.push(txt); enc.say('acao', `Pista: ${txt}`); };
  const longe = (c, tile, pes = 5) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);
  const aqui = (pts, tile) => [].concat(pts ?? []).some((q) => q.x === tile.x && q.y === tile.y);
  const vivo = (f) => f && !f.dead && f.hp > 0 && !f.fugiu;
  const naSala = (sala, p) => (P.salas[sala] ?? []).some((q) => q.x === p.x && q.y === p.y);
  const melhor = (...pericias) => {
    let r = null;
    for (const h of herois()) for (const p of pericias) if (!r || skillBonus(h, p) > skillBonus(r.h, r.p)) r = { h, p };
    return r;
  };

  // ------------------------------------------------------------- o elenco ----
  const elenco = {};
  const criar = (k, id, pos, nome, sala) => {
    if (t.mortos.includes(k) || !pos) return null;
    const m = makeMonster(id, { ...pos });
    if (nome) m.name = nome;
    m.chaveDaFenda = k;
    m.salaDaFenda = sala;
    m.side = 'neutro';
    elenco[k] = m;
    return m;
  };
  if (qual === 'fendaTrincheiras') {
    P.grellsF2.forEach((p, i) => criar(`grellF2_${i + 1}`, 'grell', p, null, 'F2'));
    criar('naruv', 'grell', P.naruv, 'Naruv', 'F3');
    criar('grellF3', 'grell', P.grellF3, null, 'F3');
  }
  if (qual === 'fendaOco') {
    P.girinos.forEach((p, i) => criar(`girino${i + 1}`, 'girinoDeSlaad', p, null, 'S2'));
    criar('slaadVermelho', 'slaadVermelho', P.slaadVermelho, null, 'S2');
    criar('chalaag', 'slaadCinzento', P.chalaag, 'Chalaag', 'S3');
  }
  if (qual === 'fendaLabirinto') criar('golcuus', 'ocular', P.golcuus, 'Golcuus', 'L7');
  const da = (sala) => Object.values(elenco).filter((m) => m.salaDaFenda === sala && vivo(m));

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

  function luta(quem) {
    for (const f of quem) {
      if (f.dead) continue;
      f.side = 'foes';
      if (!enc.combatants.includes(f)) enc.addCombatant(f);
    }
    estado.explorando = false;
    estado.lutando = [...quem];
    root.classList.remove('explorando');
    enc.emboscada = null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
    return true;
  }

  async function darXpDe(lista) {
    const grupo = todos();
    const xp = lista.filter((f) => f.dead || f.fugiu).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (!grupo.length || !xp) return;
    const cada = Math.floor(xp / grupo.length);
    const sobem = darXp(grupo, cada);
    enc.say('cura', `${F.titulo}: ${cada} XP para cada um.`);
    if (sobem.length) for (const txt of await telaDeSubirNivel(root, sobem)) enc.say('cura', txt);
  }

  function sair(fazer) {
    estado.explorando = false;
    estado.encerrado = true;
    root.classList.remove('explorando');
    fazer(todos());
  }

  /** Um golpe de área no chão (o glifo, o cadáver): todos a `raio` pés de `p` testam, e quem passa sofre metade. */
  function explosao(p, raio, save, dc, dados, tipo, oQue) {
    const linhas = [];
    for (const h of enc.combatants.filter((c) => !c.dead && c.hp > 0 && distanceFt(c.pos, p) <= raio)) {
      const sv = enc.resistencia(h, save, dc);
      const d = damageRoll(enc.rng, dados);
      const dano = sv.success ? Math.floor(d.total / 2) : d.total;
      enc.applyDamage(h, dano, tipo, null);
      linhas.push(`${h.name} ${sv.success ? 'se protege em parte' : 'é pego em cheio'}: ${dano} de ${tipo}.`);
    }
    enc.say('dano', `${oQue}: ${linhas.join(' ') || 'ninguém perto.'}`);
    return linhas;
  }

  // ---------------------------------------------------------- a esfera ----
  function girarEsfera() {
    t.esferaGirada = !t.esferaGirada;
    const [sai, entra] = t.esferaGirada ? [P.config1, P.config2] : [P.config2, P.config1];
    const aresta = (q, cod) => (q.l === 'n' ? enc.field.porAresta(q.x, q.y - 1, q.x, q.y, cod) : enc.field.porAresta(q.x - 1, q.y, q.x, q.y, cod));
    for (const q of sai) aresta(q, ARESTA.nada);
    for (const q of entra) aresta(q, ARESTA.parede);
    enc.field.alternarSobreposicao?.('olhoGirado', t.esferaGirada);
  }
  const foraDaEsferaColado = (p) => {
    const d = Math.hypot(p.x + 0.5 - ESFERA.x, p.y + 0.5 - ESFERA.y);
    return d > ESFERA.raio && d <= ESFERA.raio + 1.6;
  };
  const dentroDaEsfera = (p) => Math.hypot(p.x + 0.5 - ESFERA.x, p.y + 0.5 - ESFERA.y) <= ESFERA.raio;

  // ------------------------------------------------------------- os gatilhos ----
  async function depoisDoPasso() {
    if (!estado.explorando) return false;
    const hs = herois();
    const em = (sala) => hs.find((h) => naSala(sala, h.pos));
    const ve = (m, pes) => hs.find((h) => distanceFt(h.pos, m.pos) <= pes && enc.field.hasLineOfSight(h.pos, m.pos));
    const pronto = (sala) => da(sala).filter((m) => m.side === 'neutro');

    if (qual === 'fendaTrincheiras') {
      // os grells de F2 dão a volta pela caverna e chegam (depois do alarme dos tanques)
      if (estado.passosDoAlarme != null && pronto('F2').length) {
        estado.passosDoAlarme -= 1;
        if (estado.passosDoAlarme <= 0) {
          estado.passosDoAlarme = null;
          for (const g of pronto('F2')) { const q = enc.casaLivreMaisProxima(hs[0].pos); if (q) g.pos = { ...g.pos, x: q.x + 2, y: q.y }; const l = enc.casaLivreMaisProxima(g.pos); if (l) g.pos = { ...g.pos, ...l }; }
          await painel('Do corredor vêm mais três, flutuando devagar: os do refeitório comum deram a volta para ver o que estragou a comida.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
          return luta(pronto('F2'));
        }
      }
      if (pronto('F2').length && (em('F2') || pronto('F2').some((g) => ve(g, 30)))) {
        await painel('Em volta das calhas, três grells comem de bico enfiado na gosma. Um deles levanta a cabeça, sente vocês, e os três sobem do chão ao mesmo tempo: comida que anda é melhor que comida de calha.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(pronto('F2'));
      }
      if (pronto('F3').length && em('F3')) {
        await painel(['Junto da cascata de gosma roxa, dois grells. O maior se vira, de bico aberto, e uma voz rascante, em Comum, enche a sala:',
          '— Quem deixou isso entrar no MEU refeitório?'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(pronto('F3'));
      }
    }
    if (qual === 'fendaOco') {
      // os GLIFOS das duas passagens de S1
      for (const [k, p] of [['glifoOeste', P.glifoOeste], ['glifoNorte', P.glifoNorte]]) {
        if (t.feito[k] || !hs.some((h) => distanceFt(h.pos, p) <= 5)) continue;
        t.feito[k] = 'disparou';
        await painel('Um sinal riscado na carne do chão acende sob o pé de alguém, e o oco inteiro estremece num estrondo.');
        explosao(p, 20, 'dex', 12, '5d8', 'trovejante', 'O glifo explode');
        const c = elenco.chalaag;
        if (vivo(c) && c.side === 'neutro') {
          const q = enc.casaLivreMaisProxima({ x: p.x - 2, y: p.y });
          if (q) c.pos = { ...c.pos, x: q.x, y: q.y };
          addCondition(c, 'invisivel', { rounds: 10, source: c.id });
          await painel('Logo depois, um cheiro de ozônio, e um riso que vem do nada: alguém invisível veio ver quem pisou no glifo dele.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
          return luta([c]);
        }
        app.refresh();
        return false;
      }
      if (pronto('S2').length && em('S2')) {
        await painel('No fundo do funil, um redemoinho de água salgada. Em volta dele, uma dúzia de girinos do tamanho de cachorros entra e sai da água, e um sapo enorme e vermelho os vigia. Os girinos viram todos para vocês: carne fresca.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta(pronto('S2'));
      }
      if (vivo(elenco.chalaag) && elenco.chalaag.side === 'neutro' && em('S3')) {
        await painel(['Na câmara do vórtice, um slaad cinzento de mãos finas risca linhas de giz entre as verrugas da parede, tão absorto que só percebe vocês tarde.',
          '— Ah. Visitas. — Ele limpa o giz da mão. — Vou matar quase todos. Um eu guardo: preciso de onde pôr os meus girinos, e de carne de verruga para a cama deles.'], [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta([elenco.chalaag]);
      }
    }
    if (qual === 'fendaLabirinto') {
      const g = elenco.golcuus;
      if (vivo(g) && g.side === 'neutro' && (em('L7') || ve(g, 20))) {
        await painel('Por trás de uma parede fina, um globo de olhos do tamanho de um boi gira no ar. Todos os olhos se fecham de uma vez, e se abrem para vocês.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
        return luta([g]);
      }
    }
    return false;
  }

  function evento() {}

  // ------------------------------------------------------------- o fim ----
  async function fimDoCombate(outcome) {
    const lutou = estado.lutando ?? [];
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      await narrar(root, { formato: 'tela', paginas: [{ titulo: F.titulo, texto: ['O Reino Distante fica com o que sobrou de vocês. Do outro lado do rasgo, Illithinoch nem percebe.'] }] });
      app.encerrarPartida();
      return;
    }
    for (const f of lutou) if ((f.dead || f.fugiu) && f.chaveDaFenda) t.mortos.push(f.chaveDaFenda);
    await darXpDe(lutou);
    if (lutou.includes(elenco.golcuus) && elenco.golcuus.dead) t.feito.golcuusMorto = true;
    prepararExploracao();
  }

  // ------------------------------------------------------- as interações ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    // A VOLTA: pelo rasgo, a Illithinoch
    if (aqui(P.rasgo, tile) || (distanceFt(tile, P.rasgo) <= 5 && aqui(P.grupo, tile))) {
      ops.push({ rotulo: 'Voltar a Illithinoch', icone: 'acao-disparada', detalhe: 'pelo rasgo', motivo: longe(c, tile), fazer: () => sair((v) => app.newEncounter({ ...app.config, modo: 'campanha', capitulo: 3, cenaDaVila: 'illithinoch', chegada: qual, continuarCom: v })) });
    }
    // O GNAWBLE da runa
    if (aqui(P.runa, tile)) {
      const temUm = todos().some((h) => garantirInventario(h).bag.some((i) => i.id === F.gnawble));
      ops.push({ rotulo: 'Colher o gnawble', icone: 'acao-usarObjeto', motivo: longe(c, tile) ?? (temUm ? 'o grupo já leva o desta fenda' : null), fazer: () => colher(c) });
    }
    if (qual === 'fendaTrincheiras') {
      // a gosma das calhas: mais de um gole envenena
      if (aqui([{ x: 9, y: 7 }, P.bau], tile)) {
        ops.push({ rotulo: 'Beber a gosma', icone: 'acao-usarObjeto', detalhe: 'doce, e amarga no fim', motivo: longe(c, tile), fazer: async () => {
          c.golesDeGosma = (c.golesDeGosma ?? 0) + 1;
          if (c.golesDeGosma === 1) { enc.say('cura', `${c.name} prova a gosma: amarga, grossa, e mata a fome na hora.`); return; }
          const sv = enc.resistencia(c, 'con', 12);
          if (sv.success) { enc.say('acao', `${c.name} bebe mais, e o estômago revira, mas aguenta.`); return; }
          addCondition(c, 'envenenado', { rounds: 100, source: 'gosma' });
          await painel(`${c.name} bebe mais um gole, e o estômago se vira do avesso: envenenado por dez minutos.`);
          app.refresh();
        } });
      }
      if (aqui(P.bau, tile) && !t.feito.bau && !da('F3').length) {
        ops.push({ rotulo: 'Tirar o baú da bacia', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          t.feito.bau = true;
          guardar(c, 'tiaraDePrata', 1);
          guardar(c, 'cristalMentalAcelerado', 1);
          await painel(`No fundo da bacia, um baú pequeno, melado de gosma: os pagamentos da Naruv. Quase tudo é lixo brilhante, mas há uma tiara de prata e um cristal claro, morno ao toque. ${c.name} guarda os dois.`);
          app.refresh();
        } });
      }
      if (aqui(P.bashudu, tile) && !t.feito.bashudu) {
        ops.push({ rotulo: 'Virar o nothic do tanque do meio', icone: 'acao-procurar', motivo: longe(c, tile), fazer: () => bashudu() });
      }
    }
    if (qual === 'fendaOco') {
      for (const [k, p] of [['glifoOeste', P.glifoOeste], ['glifoNorte', P.glifoNorte]]) {
        if (t.feito[k] || distanceFt(tile, p) > 10) continue;
        ops.push({ rotulo: 'Procurar sinais no chão', icone: 'acao-procurar', detalhe: 'Investigação CD 12', motivo: longe(c, tile, 10), fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'investigacao');
          if (r.total < 12) { await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) só vê verrugas e mais verrugas.`); return; }
          t.feito[k] = 'achado';
          await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) acha, riscado na carne do chão, um sinal mágico de proteção: quem pisasse ali o faria explodir. Agora dá para passar pela beirada.`);
          app.refresh();
        } });
      }
      if (aqui(P.vortice, tile) || distanceFt(tile, P.vortice) <= 5) {
        ops.push({ rotulo: 'Entrar no vórtice', icone: 'acao-disparada', detalhe: 'some, e volta pelo redemoinho', motivo: longe(c, tile, 10), fazer: async () => {
          const horas = enc.rng.die(6) + enc.rng.die(6);
          const q = enc.casaLivreMaisProxima(P.redemoinho);
          if (q) c.pos = { ...c.pos, x: q.x, y: q.y };
          await painel(`${c.name} entra no vórtice e some. Para ${c.name}, não passa tempo nenhum: num piscar, está saindo do redemoinho salgado do funil, encharcado. Para o mundo, foram ${horas} horas.`);
          app.refresh();
        } });
      }
    }
    if (qual === 'fendaLabirinto') {
      // A ESFERA: gira de fora, por quem está encostado no anel
      if (foraDaEsferaColado(c.pos) && distanceFt(c.pos, tile) <= 10 && (dentroDaEsfera(tile) || foraDaEsferaColado(tile))) {
        const dentro = herois().filter((h) => dentroDaEsfera(h.pos));
        ops.push({ rotulo: t.esferaGirada ? 'Girar a esfera de volta' : 'Girar a esfera', icone: 'acao-empurrar',
          detalhe: dentro.length ? `${dentro.map((h) => h.name).join(', ')} lá dentro` : 'os túneis mudam', fazer: async () => {
            girarEsfera();
            await painel(`${c.name} empurra a pedra lisa e melada, e a esfera inteira gira no soquete, sem som. Os furos de anel avermelhado passam devagar, como íris, e param em outro lugar.`);
            app.refresh();
          } });
      }
      // L2: a ocular
      if (aqui(P.ocular, tile) && !t.feito.ocularQuebrada) {
        ops.push({ rotulo: 'Olhar pela ocular', icone: 'acao-procurar', detalhe: 'Inteligência CD 18', motivo: longe(c, tile), fazer: () => ocular(c) });
        ops.push({ rotulo: 'Quebrar a ocular', icone: 'acao-empurrar', motivo: longe(c, tile), fazer: async () => {
          t.feito.ocularQuebrada = true;
          await painel(`${c.name} bate na haste com força, e o copo de pedra se parte. O que quer que ele mostrasse, não mostra mais.`);
          app.refresh();
        } });
      }
      // L4: o ladrão morto armadilhado
      if (aqui(P.ladrao, tile) && !t.feito.ladrao) {
        if (!t.feito.ladraoEntendido) {
          ops.push({ rotulo: 'Examinar o cadáver de perto', icone: 'acao-procurar', detalhe: 'Investigação CD 13', motivo: longe(c, tile), fazer: async () => {
            const r = rolarPericia(enc.rng, c, 'investigacao');
            if (r.total < 13) { await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) só vê couro seco e cinto.`); return; }
            t.feito.ladraoEntendido = true;
            await painel(`${c.name} (${SKILL_NAME.investigacao} ${r.total}) percebe: há energia de morte acumulada no corpo, presa nas tiras de couro do peito. Mexer nelas a solta.`);
            app.refresh();
          } });
        }
        if (!t.feito.ladraoDesarmado) {
          ops.push({ rotulo: 'Desarmar o cadáver', icone: 'acao-usarObjeto', detalhe: 'Prestidigitação ou Religião, CD 15', motivo: longe(c, tile), fazer: async () => {
            const m = melhor('prestidigitacao', 'religiao');
            const r = rolarPericia(enc.rng, m.h, m.p);
            if (r.total >= 15) { t.feito.ladraoDesarmado = true; await painel(`${m.h.name} (${SKILL_NAME[m.p]} ${r.total}) desfaz as tiras uma a uma, e a energia escoa pelo chão sem fazer mal a ninguém.`); app.refresh(); return; }
            await painel(`${m.h.name} (${SKILL_NAME[m.p]} ${r.total}) puxa a tira errada.`);
            soltarOLadrao();
          } });
        }
        ops.push({ rotulo: 'Revistar o cinto', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          if (!t.feito.ladraoDesarmado) soltarOLadrao();
          t.feito.ladrao = true;
          if (!c.dead && c.hp > 0) guardar(c, 'adagaDeCristal', 4);
          await painel('No cinto do ladrão, quatro adagas ornamentais de cristal, finas como gelo.');
          app.refresh();
        } });
      }
      // L7: os nichos do Golcuus
      if (aqui({ x: 44, y: 6 }, tile) && !t.feito.nichos && !vivo(elenco.golcuus)) {
        ops.push({ rotulo: 'Revirar os nichos', icone: 'acao-procurar', motivo: longe(c, tile), fazer: async () => {
          t.feito.nichos = true;
          guardar(c, 'ferramentasDeJoalheiro', 1);
          guardar(c, 'rubiOlho', 3);
          guardar(c, 'estatuetaDeObservador', 1);
          await painel(`Entre ferramentas quebradas, um estojo de joalheiro inteiro, três rubis talhados como olhos e uma estatueta de ouro de um observador, com esmeraldas nos pedúnculos e um diamante no olho do meio. ${c.name} guarda tudo.`);
          app.refresh();
        } });
      }
    }
    return ops;
  }

  function soltarOLadrao() {
    t.feito.ladraoDesarmado = true;
    explosao(P.ladrao, 15, 'con', 15, '5d8', 'necrótico', 'Do peito do cadáver sai uma onda escura');
    app.refresh();
  }

  async function ocular(c) {
    t.feito.viuAPiscina = true;
    o7.feito.viuAPiscinaSalobra = true;
    const sv = enc.resistencia(c, 'int', 18);
    const visao = 'Uma piscina enorme de salmoura, inteira, de cima: as ilhas de carne, os canais, e no fundo dela um buraco escuro que não reflete nada. É uma passagem para um lugar ainda mais fundo do Reino.';
    if (!sv.success) {
      addCondition(c, 'debilitado', { rounds: Infinity, source: 'ocular' });
      await painel([`${c.name} encosta o olho no copo de pedra. ${visao}`, `A visão é grande demais para uma cabeça só: a mente de ${c.name} se desfaz por dentro (Inteligência ${sv.total} contra CD 18). Fica de mente debilitada, até alguém curar.`]);
    } else {
      await painel([`${c.name} encosta o olho no copo de pedra. ${visao}`, `${c.name} aguenta a visão (Inteligência ${sv.total} contra CD 18) e guarda o caminho na cabeça.`]);
    }
    pista('Pela ocular do Golcuus: a Piscina Salobra inteira, e um buraco escuro no fundo dela que é passagem para um lugar mais fundo do Reino Distante.');
    app.refresh();
  }

  async function bashudu() {
    t.feito.bashudu = true;
    await painel(['O nothic do tanque do meio ainda respira. Quando vocês o viram de barriga para cima, o olho único se abre, e uma voz molhada entra na cabeça de todos:',
      '— Os escolhidos... nos venderam. Eu e os meus, trocados com a grell por um canto para a runa deles. Como se fôssemos comida. Éramos devoradores de mentes, antes de virar isto. — O olho se fecha devagar. — Digam a eles... que Bashudu...',
      'E não diz mais nada.']);
    pista('O Bashudu, nothic das Trincheiras: os fanáticos trocaram os nothics com a grell Naruv por um lugar para a runa.');
    alarmeDosTanques();
  }

  /** MEXER nos nothics ou na gosma dos tanques muda o gosto: os grells de F3 vêm na hora, os de F2 dão a volta. */
  function alarmeDosTanques() {
    if (t.feito.alarme) return;
    t.feito.alarme = true;
    const f3 = da('F3').filter((m) => m.side === 'neutro');
    if (f3.length) {
      for (const g of f3) { const q = enc.casaLivreMaisProxima(herois()[0].pos); if (q) g.pos = { ...g.pos, x: q.x, y: q.y }; }
      enc.say('acao', 'A gosma dos tanques muda de cor. Da passagem alta vem um grito rascante: a Naruv sentiu o gosto mudar.');
      luta(f3);
    }
    if (da('F2').some((m) => m.side === 'neutro')) estado.passosDoAlarme = 6;
  }

  async function colher(c) {
    // em L6, se o Golcuus ainda não foi enfrentado, ele sai do covil para interceptar
    guardar(c, F.gnawble, 1);
    t.feito.colhido = (t.feito.colhido ?? 0) + 1;
    await painel(`${c.name} puxa a bola de pelo da runa. Ela se solta com um estalo, abre a boca cheia de dentes e morde a mão de ${c.name}; depois, sem motivo nenhum, se aninha no braço dele e fica quieta. A runa se apaga um pouco mais.`);
    const g = elenco.golcuus;
    if (qual === 'fendaLabirinto' && vivo(g) && g.side === 'neutro') {
      const q = enc.casaLivreMaisProxima({ x: c.pos.x + 3, y: c.pos.y, f: 2 });
      if (q) g.pos = { ...g.pos, x: q.x, y: q.y };
      await painel('Pelo corredor vem um farfalhar de pálpebras: o dono do labirinto sentiu a runa e veio ver quem mexeu nela.', [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }]);
      luta([g]);
    }
    app.refresh();
  }

  return {
    lugar: F.titulo,
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    interacoes,
    depoisDeMover(c) {
      if (c && estado.explorando) c.movementLeftFt = MOVIMENTO;
      return depoisDoPasso(c);
    },
    fimDoCombate,
    evento,
    dialogoDe: () => null,
    elenco,
    girarEsfera,
    async iniciar() {
      for (const m of Object.values(elenco)) if (!enc.combatants.includes(m)) enc.addCombatant(m);
      if (t.esferaGirada) { t.esferaGirada = false; girarEsfera(); }
      // a fenda rompe o vínculo psíquico do cérebro ancião
      for (const h of todos()) if (hasCondition(h, 'vinculoPsiquico')) removeCondition(h, 'vinculoPsiquico');
      // A EXPOSIÇÃO: na primeira vez de cada herói nesta fenda
      const linhas = [];
      for (const h of herois()) {
        if (t.expostos.includes(h.name)) continue;
        t.expostos.push(h.name);
        const sv = enc.resistencia(h, 'con', 12);
        if (sv.success) linhas.push(`${h.name} sente o estômago virar, e aguenta (Constituição ${sv.total}).`);
        else { addCondition(h, 'envenenado', { rounds: 600, source: 'reinoDistante' }); linhas.push(`${h.name} vomita na primeira respiração (Constituição ${sv.total}): envenenado por uma hora.`); }
      }
      if (linhas.length) {
        await painel([`Atravessar o rasgo é como mergulhar em água morna e grossa. Do outro lado, o ar tem gosto de metal. ${F.sensacao} E não há norte: a única direção que faz sentido aqui é "de onde se veio".`, ...linhas]);
      }
      prepararExploracao();
    },
  };
}
