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
// BANDO GRANDE (6 ou mais) chega em duas levas: metade no começo, o resto na
// terceira rodada, pela borda. O número é o do livro; a chegada aos poucos é
// nossa — o revisor de encontro mediu que seis hobgoblins de uma vez matavam
// o grupo inteiro de nível 2 em mais de um terço das lutas.
//
// Vencida a luta, a viagem continua de onde parou (`continuarViagem`).

import { narrar } from '../view/narrativa.js';
import { d20 } from '../core/dice.js';
import { skillBonus, passivePerception } from '../rules/abilities.js';
import { ritmoDe, furtividadeDoGrupo } from '../rules/marcha.js';
import { makeMonster } from '../rules/monsters.js';
import { continuarViagem } from './regiao.js';
import { prepararLevas } from './levas.js';

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

  // Onde cada um aparece: de dia, metade pelo leste da trilha e metade pelas
  // colinas do sudeste; de noite, em roda, saindo do escuro — longe da
  // fogueira o bastante para a vigia ter tempo de gritar.
  const tomadas = new Set();
  function lugares(n, segunda = false) {
    const out = [];
    for (let i = 0; i < n; i++) {
      let p;
      if (noite) {
        const a = (i / n) * Math.PI * 2 + (segunda ? 0.4 + Math.PI / n : 0.4);
        p = { x: Math.round(11 + Math.cos(a) * 10), y: Math.round(7 + Math.sin(a) * 6.2) };
      } else if ((i + (segunda ? 1 : 0)) % 2 === 0) {
        p = { x: 18 + (i % 3), y: 3 + Math.floor(i / 6) * 2 + (i % 2) };
      } else {
        p = { x: 19 + (i % 3), y: 11 + (Math.floor(i / 2) % 3) };
      }
      p.x = Math.max(1, Math.min(21, p.x));
      p.y = Math.max(0, Math.min(13, p.y));
      // Casa livre de verdade: nem herói, nem outro da mesma leva.
      let q = enc.casaLivreMaisProxima(p) ?? p;
      for (let r = 1; tomadas.has(`${q.x},${q.y}`) && r < 6; r++) q = enc.casaLivreMaisProxima({ x: p.x - r, y: p.y }) ?? q;
      tomadas.add(`${q.x},${q.y}`);
      out.push(q);
    }
    return out;
  }

  const inimigos = [];
  const primeira = e.qtd >= 6 ? Math.ceil(e.qtd / 2) : e.qtd;
  const posicoes = [...lugares(primeira), ...lugares(e.qtd - primeira, true)];
  for (const [i, p] of posicoes.entries()) {
    const f = makeMonster(e.id, { x: p.x, y: p.y }, { nameSuffix: e.qtd > 1 ? 'ABCDEFGHIJKL'[i] : '' });
    f.facingVec = { dx: Math.sign(11 - p.x) || -1, dy: Math.sign(7 - p.y) };
    inimigos.push(f);
  }

  let levas = null;

  async function fimDoCombate(outcome) {
    if (estado.encerrado) return;
    estado.encerrado = true;
    levas?.limpar();
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
      texto.push('Um dos hobgoblins guardava, dobrado várias vezes, um retrato a carvão: torto, borrado, mas é um de vocês, sem dúvida. No verso, um valor em ouro e uma aranha negra desenhada à pena, no lugar da assinatura. Alguém está pagando pela cabeça de vocês.');
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
      for (const f of inimigos.slice(0, primeira)) enc.addCombatant(f);
      // O resto do bando chega na terceira rodada.
      levas = prepararLevas(enc, [{ rodada: 3, units: inimigos.slice(primeira),
        aviso: noite ? 'Mais deles saem do escuro, do outro lado da fogueira!' : 'Mais deles sobem a trilha, correndo para alcançar os outros!' }]);
      // Quem chega escondido: de noite, todos; de dia, só os que caçam.
      const escondidos = noite || CACADORES.has(e.id);
      const primeiros = inimigos.slice(0, primeira);
      // Em ritmo lento o grupo anda escondido (`rules/marcha.js`): ninguém o
      // pega de surpresa, e se a Furtividade dele passar da Percepção passiva
      // do bando, quem embosca é o grupo. Regra da casa: o livro só diz que o
      // ritmo lento "permite usar furtividade" e não detalha o resultado.
      // De DIA e em ritmo lento o grupo anda escondido (`rules/marcha.js`): se
      // o teste de grupo de Furtividade passar da Percepção passiva do bando,
      // quem embosca é o grupo. Falhando, o encontro corre como correria no
      // passo normal — andar devagar não apaga a emboscada de quem caça.
      // À noite o grupo está parado na fogueira: ritmo nenhum vale ali.
      const ritmo = ritmoDe(camp.viagem?.ritmo);
      const nossa = !noite && ritmo.furtivo
        ? furtividadeDoGrupo(enc.rng, enc.allOf('party'), primeiros, passivePerception)
        : null;
      if (nossa?.furtivo) {
        // UMA rolagem, a do grupo: `rolarSurpresa` fica com o MENOR valor da
        // lista, então mandar as quatro faria a pior delas valer por todas e a
        // emboscada não surpreenderia ninguém.
        enc.emboscada = { emboscadores: 'party', furtividade: [nossa.rolagem] };
        enc.say('inicio', `O grupo vinha devagar e em silêncio (Furtividade ${nossa.rolagem} contra ${nossa.atencao}): são eles que são pegos.`);
      } else {
        if (nossa) enc.say('inicio', `O grupo vinha devagar, mas foi ouvido (Furtividade ${nossa.rolagem} contra ${nossa.atencao}).`);
        enc.emboscada = escondidos
          ? { emboscadores: 'foes', furtividade: primeiros.map((f) => d20(enc.rng, skillBonus(f, 'furtividade')).total) }
          : null;
      }
      app.selected = null;
      enc.start();
      if (enc.side === 'party') app.select(app.firstActive());
      app.refresh();
    },
  };
}
