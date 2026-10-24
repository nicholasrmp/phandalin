// UM ENCONTRO NA TRILHA TRIBOAR (Parte 3 da aventura), sorteado na viagem
// pela região (`game/regiao.js`, tabela `ENCONTROS`).
//
// As regras são as do livro; o texto é nosso:
//   - o XP é o dos monstros, somado e dividido pelo grupo;
//   - goblins sabem onde fica o Castelo Dentefino e contam se capturados e
//     ameaçados; cada um leva 1d10 peças de cobre;
//   - hobgoblins caçam o grupo pela recompensa do Aranha Negra: um deles traz
//     um retrato malfeito de um dos heróis. Sabem do castelo, mas só falam
//     enfeitiçados — o que o motor ainda não faz fora da luta;
//   - o ogro e o urso-coruja lutam até o fim.
// A SURPRESA é decisão nossa (o livro deixa com o mestre): de dia, quem caça
// (lobos, urso-coruja, hobgoblins) tenta chegar escondido; de noite, todos
// chegam no escuro, contra a vigia de quem estiver acordado.
//
// Vencida a luta, a viagem continua de onde parou (`continuarViagem`).

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus } from '../rules/abilities.js';
import { makeMonster } from '../rules/monsters.js';
import { continuarViagem } from './regiao.js';

const CACADORES = new Set(['lobo', 'corujaUrso', 'hobgoblin']);

export function criarEstrada(app, config) {
  const enc = app.enc;
  const root = app.root;
  const e = config.encontro;
  const noite = e.periodo === 'noite';
  const estado = { encerrado: false };
  const camp = (app.campanha ??= {});
  const feitos = (camp.feitos ??= {});
  const vila = (camp.vila ??= { pistas: [] });

  // Onde cada um aparece: de dia, pelo leste da trilha e pelas colinas do
  // norte; de noite, em roda, saindo do escuro.
  function lugares(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      let p;
      if (noite) {
        const a = (i / n) * Math.PI * 2 + 0.4;
        p = { x: Math.round(11 + Math.cos(a) * 8), y: Math.round(7 + Math.sin(a) * 5.5) };
      } else {
        p = { x: 18 + (i % 3), y: 3 + Math.floor(i / 3) * 2 + (i % 2) };
      }
      p.x = Math.max(1, Math.min(20, p.x));
      p.y = Math.max(1, Math.min(13, p.y));
      out.push(enc.casaLivreMaisProxima(p) ?? p);
    }
    return out;
  }

  const inimigos = [];
  for (const [i, p] of lugares(e.qtd).entries()) {
    const f = makeMonster(e.id, { x: p.x, y: p.y }, { nameSuffix: e.qtd > 1 ? 'ABCDEFGHIJKL'[i] : '' });
    f.facingVec = { dx: Math.sign(11 - p.x) || -1, dy: Math.sign(7 - p.y) };
    inimigos.push(f);
  }

  async function fimDoCombate(outcome) {
    if (estado.encerrado) return;
    estado.encerrado = true;
    const grupo = enc.combatants.filter((c) => c.side === 'party');
    if (outcome !== 'vitoria') {
      await narrar(root, { formato: 'tela', paginas: [{ titulo: 'Na Trilha Triboar', texto: [
        'A trilha fica quieta de novo. Ninguém volta a Phandalin para contar o que aconteceu.'] }] });
      app.encerrarPartida();
      return;
    }
    const texto = [];
    const vivos = grupo.filter((c) => !c.dead);
    const quem = vivos[0];
    const guardar = (c, id, qtd) => {
      const b = (c.bag ??= []).find((i) => i.id === id);
      if (b) b.qtd += qtd; else c.bag.push({ id, tipo: 'item', qtd });
    };
    if (e.id === 'goblin' && quem) {
      let pc = 0;
      for (let i = 0; i < inimigos.length; i++) pc += enc.rng.die(10);
      guardar(quem, 'moedaDeCobre', pc);
      texto.push(`Nas algibeiras dos goblins: ${pc} peças de cobre. ${quem.name} guarda.`);
      const preso = inimigos.find((f) => f.capturado && !f.dead);
      if (preso && !feitos.sabeOCastelo) await interrogarGoblin(preso, texto);
    }
    if (e.id === 'hobgoblin') {
      texto.push('Dobrado no cinto de um dos hobgoblins, um papel sujo: um rosto mal desenhado — é de um de vocês, sem dúvida —, um "25 peças de ouro por este" e, embaixo, uma aranha preta.');
      if (!vila.pistas.some((p) => p.startsWith('Hobgoblins caçam'))) {
        (vila.pistas ??= []).push('Hobgoblins caçam o grupo na estrada: o Aranha Negra pôs 25 peças de ouro na cabeça de um de vocês.');
      }
    }
    if (texto.length) await narrar(root, { formato: 'painel', paginas: [{ texto }] });
    const xp = inimigos.filter((f) => f.dead || f.hp <= 0 || f.capturado).reduce((s, f) => s + (f.xp ?? 0), 0);
    if (xp) app.xpPendente = { xp: (app.xpPendente?.xp ?? 0) + xp, motivo: `Na Trilha Triboar (${e.nome})` };
    fecharTabuleiro();
    continuarViagem(app, vivos);
  }

  async function interrogarGoblin(preso, texto) {
    const fim = await app.conversarCom(preso, {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `${preso.name} acorda amarrado e já começa a negociar a própria pele.`,
          fala: 'Não mata! Não mata! Goblin sabe coisa!',
          opcoes: [
            { texto: 'Onde fica o Castelo Dentefino?', teste: { pericia: 'intimidacao', cd: 10 }, sucesso: 'conta', falha: 'enrola' },
            { texto: 'Soltar o goblin.', fim: 'solto' },
          ],
        },
        enrola: { fala: 'Castelo? Que castelo? Goblin só passeia…', opcoes: [{ texto: 'Apertar mais.', vai: 'oi', uma: true }, { texto: 'Soltar o goblin.', fim: 'solto' }] },
        conta: {
          ao: () => { feitos.sabeOCastelo = true; },
          fala: 'Na mata grande, ao norte! Sai da trilha onde tem a pedra rachada, segue o riacho seco, e vai pela trilha dos bichos até as torres caídas. O rei mora lá. Grol. Grande, feio, morde.',
          opcoes: [{ texto: 'Soltar o goblin.', fim: 'solto' }],
        },
      },
    });
    void fim;
    if (feitos.sabeOCastelo) {
      (vila.pistas ??= []).push('Um goblin capturado na Trilha Triboar ensinou o caminho do Castelo Dentefino: ao norte, dentro da Floresta de Neverwinter. Agora ele aparece no mapa da região.');
      texto.push('O Castelo Dentefino agora aparece no mapa da região.');
    }
  }

  function fecharTabuleiro() {
    app.capitulo = null;
    app.enc = null;
    app.board = null;
    app.selected = null;
    app.mode = null;
    root.classList.remove('explorando');
  }

  return {
    lugar: 'Trilha Triboar',
    get explorando() { return false; },
    get encerrado() { return estado.encerrado; },
    interacoes: () => [],
    depoisDeMover() {},
    fimDoCombate,
    evento() {},
    async iniciar() {
      const o = noite
        ? 'O fogo estala. Do lado de fora da luz, alguma coisa se mexe — e não é uma só.'
        : 'Na curva da trilha, entre as pedras e o capim alto, vocês não estão sozinhos.';
      await narrar(root, { formato: 'painel', paginas: [{ titulo: noite ? 'Acampamento' : 'Trilha Triboar', texto: [o] }],
        escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }] });
      for (const f of inimigos) enc.addCombatant(f);
      // Quem chega escondido: de noite, todos; de dia, só os que caçam.
      const escondidos = noite || CACADORES.has(e.id);
      enc.emboscada = escondidos
        ? { emboscadores: 'foes', furtividade: inimigos.map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total) }
        : null;
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}
