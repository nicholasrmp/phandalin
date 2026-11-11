// Capítulo 2 da campanha: o esconderijo dos goblins (`game/esconderijo.js`).
//
// Conferido com a descrição de cada área na aventura. As REGRAS de cada sala
// seguem o livro (números, testes, quem está onde); o TEXTO é nosso.
//
//   a trilha    duas armadilhas no caminho: um laço (Percepção passiva 12) e
//               um fosso coberto (passiva 15). Quem vai na frente arrisca.
//   área 1      o grupo chega de dia. O caminho seco entra pelo lado direito
//               do riacho.
//   área 2      dois vigias preguiçosos num posto de ripas no meio do mato.
//               Notam o grupo quando alguém atravessa para o lado leste do
//               riacho (ninguém surpreso — ou eles, se quem atravessa passar
//               na Furtividade). Barulho lá fora (descansar ali) os faz
//               atacar primeiro.
//   área 3      três lobos acorrentados; não alcançam os degraus. Lidar com
//               Animais CD 15 (10 com comida) acalma. Vendo alguém fora do
//               alcance, puxam a corrente: Força CD 15, depois CD 10, e
//               soltam. No fundo, a chaminé de 9 m até a área 8 (Atletismo
//               CD 10).
//   área 4      a passagem do oeste é entulho, e o ressalto do meio é frágil:
//               quem passa de 45 kg o quebra (Destreza CD 10, 2d6 e cai).
//   área 5      um goblin escondido na ponte. Visto só com Percepção contra a
//               Furtividade dele; nota quem traz luz ou chega sem cuidado.
//               Quando nota, assobia para o fundo e atira de arco; dois
//               turnos dos goblins depois, desce a ENCHENTE pelo túnel.
//   área 6      quatro goblins junto ao fogo na parte baixa, Yeemik em cima com
//               Sildar amarrado (1 PV). Quando o grupo está ganhando, Yeemik
//               pede trégua com a faca no pescoço do refém e propõe a cabeça
//               de Klarg. Recusado, joga Sildar do ressalto. Mesmo com Klarg
//               morto, cobra resgate.
//   área 7      três goblins. Começada a luta ali, um corre avisar Klarg.
//   área 8      Klarg, o lobo Serrote e dois goblins. Avisado, arma a
//               emboscada; desavisado, pode ser surpreendido — ainda mais por
//               quem sobe pela chaminé. Morto o Serrote, Klarg foge pela
//               chaminé. O baú está escondido entre os suprimentos.
//
// Cada sala é um GRUPO que só entra no tabuleiro quando é visto ou nota um
// herói (`depoisDeMover`); a luta acaba quando aquele grupo cai.
//
// Mesma interface de cena do capítulo 1 (`main.js` conversa com ela por
// `explorando`, `interacoes`, `depoisDeMover`, `fimDoCombate`, `evento` e os
// ganchos de conversa e descanso).
//
// TEXTO NOSSO. Yeemik, Klarg, Sildar e os outros nomes do cenário entram pela
// Fan Content Policy; nenhuma fala ou descrição é do livro, nem parafraseada.

import { narrar } from '../view/narrativa.js';
import { danoDeQueda } from '../rules/passivas.js';
import { d20 } from '../core/dice.js';
import { abilityMod, skillBonus, passivePerception, SKILL_NAME, rolarPericia } from '../rules/abilities.js';
import { distanceFt, Battlefield, SUPERFICIES } from '../core/grid.js';
import { podeVer, visaoNoEscuro, emiteLuz } from '../rules/luz.js';
import { addCondition, hasCondition } from '../rules/conditions.js';
import { darXp, proximoNivelEm } from './nivel.js';
import { audio } from '../core/audio.js';
import { telaDeSubirNivel } from '../view/nivel-tela.js';
import { ctxDe } from './magias-fora.js';
import { rolarTeste, ativaDe } from '../rules/utilidade.js';
import { guardar, totalEmCobre, cobrar } from './comercio.js';
import { garantirInventario } from '../rules/equipment.js';
import { criarBuscas } from './buscas.js';
import { PONTOS_DO_ESCONDERIJO as PE } from './esconderijo.js';
import { fogueiraAcesa } from './fogo.js';
import { disparar } from '../rules/regioes.js';
import { makeMonster } from '../rules/monsters.js';

const MOVIMENTO = 60;
// Os 275 XP do esconderijo (o marco do livro) pagos conforme as salas caem; o que sobra sai ao limpar tudo (`fimDoCapitulo`).
// Os vigias e a ponte ficam no caminho do covil: 75 + 100 + 125 = 300, o 2º nível, antes do covil e do Klarg. Quem pula uma
// sala (a chaminé do canil, a boca do túnel) recebe o que faltou no fim (`fimDoCapitulo`): o total segue 350 para todos.
// A cobra do ressalto (o Obelisco) vale 50 XP no bloco, e a parcela é por herói: 50 dividido pelos quatro.
const PARCELAS_DO_ESCONDERIJO = { vigias: 100, ponte: 125, pocos: 50, cobra: 12 };

// `clima` é o que se sente ao chegar: cheiro, som e o sinal de quem vive ali. Entra antes do aviso de combate, para a sala não ser só um
// número de goblins. Texto nosso.
const SALAS = {
  vigias: { nome: 'o posto dos vigias', em: 'no mato', clima: 'Cheiro de fumaça fria e de casca de fruta podre; um dado de osso rola, esquecido, na tábua de um abrigo de ripas.' },
  canil: { nome: 'o canil', em: 'no canil', clima: 'O fedor de pelo molhado vem antes de tudo. Correntes arrastam no escuro, e algo grande rosna baixo, sem pressa.' },
  cobra: { nome: 'a subida', em: 'na subida', clima: 'O entulho da subida estala sob o pé. Há um cheiro seco, de pele velha largada, e um silvo que parece vento até deixar de parecer.' },
  ponte: { nome: 'a ponte', em: 'na ponte', clima: 'O riacho corre ruidoso embaixo, abafando passos. As tábuas da ponte estão remendadas com portas velhas e cordas de tripa.' },
  covil: { nome: 'o covil', em: 'no covil', clima: 'Alguém está cozinhando, e o que quer que seja já cozinha há tempo demais. A fumaça fica parada à meia altura, e por baixo dela há colchões de palha amassados, ossos roídos jogados onde caíram e um cheiro azedo de pele que não acabou de curtir.' },
  pocos: { nome: 'os poços', em: 'nos poços', clima: 'Água parada em tanques escuros, e o gotejar que não para. Caixas de madeira marcadas com um leão azul estão empilhadas num canto, abertas à força.' },
  chefe: { nome: 'a caverna de Klarg', em: 'na caverna de Klarg', clima: 'O calor aqui é de forno, e o cheiro é de carne deixada de molho. A luz vem de uma fogueira no meio do chão, e o que ela ilumina primeiro são os espetos fincados em volta, com crânio de lobo em cada um. Atrás deles, peles esticadas para secar. Mais atrás, encostada no fundo e maior do que devia ser, uma coisa dorme sentada.' },
};

// A PLANTA é a do battlemap da FA (`game/esconderijo.js`, gerado por `src/dev/mapa-esconderijo-fa.mjs`). Este
// arquivo não repete número de casa nenhum: as SALAS vêm do mapa (`field.sala`) e os PONTOS de `PE`.
const salaDe = (field, p) => field.sala?.get(`${p.x},${p.y}`) ?? null;
const naLista = (lista, p) => lista.some((q) => q.x === p.x && q.y === p.y);

// Cruzar o riacho lá fora para o lado dos vigias. O riacho corre em x 10–11; quem pisa nele ou além, a céu aberto,
// está atravessando.
const atravessou = (field, p) => p.y >= 14 && p.x >= 10 && ['fora', 'vigias'].includes(salaDe(field, p));

// E O POSTO VIGIA A BOCA, que é o trabalho dele. Durante um tempo o gatilho dos vigias era SÓ a linha de cima, e o
// `y >= 14` dela abria um buraco que eu medi no motor: a fileira y = 13 em x 10–12 é sala `passagem` — a goela da
// caverna — a QUINZE PÉS do abrigo de ripas e à vista dos dois goblins, e a casa (13,13) fica dentro da própria
// sala `vigias`. Pelo lado seco OESTE da água dava para sair da grama em (9,13), pisar em (10,13) e subir inteiro
// para dentro do esconderijo sem que os vigias existissem: cem de XP e o aviso ao Klarg ficavam no mato para
// sempre. Medido: do lado de fora o grupo chega a 55–60 pés e os vigias já o veem, então visão sozinha dispararia
// na chegada; é o `x >= 10` que guarda a clareira da trilha (área 1, a oeste da água, onde o livro põe o grupo), e
// com ele até 30 pés de raio não acende nada lá. A 20 pés o laço fecha a boca (y 12 e 13) e deixa em paz a goela
// funda (y 11 a 25 pés, y 10 a 30), que é assunto das outras salas. O riacho ainda decide o TEXTO: quem entra pelo
// lado seco não "atravessa o riacho" nenhum, e dizer que atravessou seria mentir para o jogador.
const NA_BOCA = ['fora', 'vigias', 'passagem'];
const OLHO_DO_POSTO_FT = 20;
const olhoDoPosto = (field, postos, p) => p.x >= 10 && NA_BOCA.includes(salaDe(field, p))
  && postos.some((f) => distanceFt(f.pos, p) <= OLHO_DO_POSTO_FT && field.hasLineOfSight(f.pos, p));

// A passagem por onde a enchente desce (livro, área 5): a passagem da área 4 e os degraus da área 3 — e o canal
// sob a ponte, que é a mesma água. Quem está na ponte, no anel alto ou no canil propriamente dito fica fora: é o
// nível que decide, e eles estão do 2 para cima.
const naPassagem = (field, p) => ['passagem', 'canil', 'ponte'].includes(salaDe(field, p)) && field.heightAt(p.x, p.y) <= 1;

const RESSALTO = PE.ressalto;                              // área 4
const CHAMINE_BASE = PE.chamineBase;                       // área 3
const CHAMINE_TOPO = PE.chamineTopo;                       // área 8
const DENTRO_DO_KLARG = (field, p) => salaDe(field, p) === 'chefe';

export function criarCapitulo2(app, config) {
  const enc = app.enc;
  const root = app.root;
  const todos = app.inimigosEscondidos;
  const grupos = {};
  for (const f of todos) (grupos[f.grupo] ??= { id: f.grupo, membros: [], ativo: false, vencido: false }).membros.push(f);
  for (const g of Object.values(grupos)) {
    g.furtividade = g.membros.filter((f) => f.side === 'foes').map((f) => rolarPericia(enc.rng, f, 'furtividade').total);
  }
  const yeemik = grupos.covil.membros.find((f) => f.defId === 'yeemik');
  const sildar = grupos.covil.membros.find((f) => f.npcId === 'sildar');
  const klarg = grupos.chefe.membros.find((f) => f.defId === 'klarg');
  const serrote = grupos.chefe.membros.find((f) => f.name === 'Serrote');
  const estado = {
    explorando: false, encerrado: false, lutando: null,
    acordo: false, sildarLivre: false, tregua: false, tregaFeita: false,
    enchente: null, enchentes: 0, klargAvisado: false, subiuChamine: false,
    lobosRosnaram: false, ponteCortada: false, diqueRompido: false,
    // Uma tentativa por herói em cada ponto (`game/buscas.js`).
    buscas: {},
    bauAchado: false, klargFugiu: false,
  };

  const buscas = criarBuscas(estado.buscas);

  const herois = () => enc.combatants.filter((c) => c.side === 'party' && !c.dead && c.hp > 0);
  const hostis = (g) => g.membros.filter((f) => f.side === 'foes' && !f.dead && !f.fugiu);
  const pendentes = () => Object.values(grupos).filter((g) => !g.ativo && !g.vencido && !g.tregua && hostis(g).length);
  // Os testes passam pelas magias de utilidade: Orientação soma 1d4, Falar com Animais dá vantagem.
  const teste = (c, pericia, cd) => {
    const x = ctxDe(app, enc);
    const r = rolarTeste(x.estado, x.herois(), enc.rng, c, pericia, cd);
    return { quem: r.quem, pericia: r.pericia, total: r.total, cd, passou: r.passou, fontes: r.fontes };
  };
  const casaPerto = (p) => enc.casaLivreMaisProxima(p) ?? p;

  function prepararExploracao() {
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

  function trazer(g) {
    if (g.ativo) return;
    g.ativo = true;
    for (const f of g.membros) {
      if (enc.combatants.includes(f)) continue;
      if (enc.occupied(f.pos.x, f.pos.y)) f.pos = { ...f.pos, ...casaPerto(f.pos) };
      enc.addCombatant(f);
    }
  }

  /**
   * Começa a luta com um grupo. `surpresa`: 'deles' (eles emboscam), 'nossa'
   * (o grupo de heróis os pega desprevenidos) ou null.
   */
  async function combate(g, surpresa = null) {
    trazer(g);
    estado.explorando = false;
    estado.lutando = g;
    root.classList.remove('explorando');
    enc.emboscada = surpresa === 'deles'
      ? { emboscadores: 'foes', furtividade: g.furtividade }
      : surpresa === 'nossa'
        ? { emboscadores: 'party', furtividade: herois().map((h) => rolarPericia(enc.rng, h, 'furtividade').total) }
        : null;
    app.selected = null;
    enc.start();
    if (enc.side === 'party') app.select(app.firstActive());
    app.refresh();
  }

  const asArmas = (texto) => narrar(root, {
    formato: 'painel',
    paginas: [{ texto: [].concat(texto) }],
    escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }],
  });

  // ---------------------------------------------------------- a trilha ----
  /** As duas armadilhas da trilha, para quem vai na frente. */
  async function armadilhas() {
    const frente = herois()[0];
    if (!frente) return;
    // Com o goblin capturado guiando, o grupo desvia das armadilhas.
    if (app.campanha?.capitulo1?.guia) {
      await narrar(root, { formato: 'painel', paginas: [{ texto: [
        'O goblin amarrado vai na frente, puxado pela corda, e aponta com o queixo: ali um laço escondido nas folhas, mais adiante um fosso coberto. Vocês desviam dos dois.'] }] });
      return;
    }
    const paginas = [];
    // O laço.
    const vLaco = passivePerception(frente) >= 12 || teste(frente, 'percepcao', 12).passou;
    if (vLaco) {
      paginas.push({ texto: [`Uns dez minutos de trilha adentro, ${frente.name} para e aponta: um laço de corda escondido nas folhas, amarrado a um galho vergado. Vocês desarmam e seguem.`] });
    } else {
      const r = enc.resistencia(frente, 'dex', 10);
      paginas.push({ texto: [r.success
        ? `O chão estala sob o pé de ${frente.name} e um laço salta das folhas — ${frente.name} pula para trás a tempo.`
        : `Um laço se fecha no tornozelo de ${frente.name} e o puxa de cabeça para baixo, três metros acima da trilha. Os outros cortam a corda segurando ${frente.name}, e ninguém cai.`] });
    }
    // O fosso.
    const vFosso = passivePerception(frente) >= 15 || teste(frente, 'percepcao', 15).passou;
    if (vFosso) {
      paginas.push({ texto: [`Mais adiante, ${frente.name} desconfia de um trecho de folhas arrumado demais: debaixo, um fosso de três metros. Vocês o contornam.`] });
    } else {
      const r = enc.resistencia(frente, 'dex', 10);
      if (r.success) {
        paginas.push({ texto: [`As folhas cedem sob ${frente.name}: um fosso! ${frente.name} se agarra na beirada e sai.`] });
      } else {
        const dano = danoDeQueda(frente, enc.rng.die(6));
        enc.applyDamage(frente, dano, 'concussão');
        enc.say('dano', `${frente.name} cai no fosso da trilha: ${dano} de dano.`);
        paginas.push({ texto: [`As folhas cedem e ${frente.name} despenca num fosso de três metros (${dano} de dano). As paredes não são íngremes; sair dá só trabalho.`] });
      }
    }
    await narrar(root, { formato: 'painel', paginas });
  }

  async function abertura() {
    await narrar(root, {
      formato: 'tela',
      paginas: [{
        titulo: 'A trilha dos goblins',
        texto: [
          'A trilha corre para noroeste pelo mato, uns sete quilômetros. Pegadas pequenas, muitas, indo e vindo — e o rastro de dois corpos grandes arrastados.',
          `${herois()[0]?.name ?? 'Quem vai na frente'} vai na frente, de olho no chão.`,
        ],
      }],
    });
    await armadilhas();
  }

  async function chegada() {
    const semVisao = herois().filter((c) => !visaoNoEscuro(c)).map((c) => c.name);
    await narrar(root, {
      formato: 'painel',
      paginas: [{
        texto: [
          'O barulho de água chega antes da caverna. É um riacho raso, que sai de dentro do morro e cruza a trilha onde ela acaba — e é só seguindo-o de volta que se vê a boca: larga, baixa, aberta no pé da encosta e meio escondida pelo mato fechado que cresceu em volta dela. Pela margem direita da água corre uma faixa de chão seco, estreita o bastante para passar um de cada vez, e ela vai dar lá dentro.',
          semVisao.length
            ? `Lá dentro é breu. ${semVisao.length > 1 ? `${semVisao.slice(0, -1).join(', ')} e ${semVisao.at(-1)} não enxergam` : `${semVisao[0]} não enxerga`} no escuro: botão direito num herói acende a tocha — que também mostra o grupo a quem está no escuro.`
            : 'Lá dentro é breu, mas todos aqui enxergam no escuro até 60 pés.',
        ],
      }],
    });
  }

  // ------------------------------------------------------------ quem vê ----
  const nota = (f, c) => podeVer(enc, f, c) && (emiteLuz(c) || distanceFt(f.pos, c.pos) <= 30);

  async function depoisDeMover(c) {
    if (!estado.explorando) return;
    c.movementLeftFt = MOVIMENTO;
    await contarAQueda();
    if (estado.enchente) { await enchente(); if (!estado.explorando) return; }
    for (const g of pendentes()) {
      if (g.id === 'vigias') { if (await vigias(g, c)) return; continue; }
      if (g.id === 'ponte') { if (await ponte(g)) return; continue; }
      if (g.id === 'cobra') { if (await cobra(g)) return; continue; }
      if (g.id === 'canil') { if (await canil(g)) return; continue; }
      if (g.id === 'chefe' && estado.klargAvisado) {
        // Avisado, Klarg se esconde atrás das estalagmites e espera.
        const entrou = herois().find((h) => DENTRO_DO_KLARG(enc.field, h.pos));
        if (entrou) {
          await asArmas(`${entrou.name} mal pisa na caverna e uma sombra enorme se levanta atrás de uma estalagmite: Klarg estava esperando.`);
          await combate(g, 'deles');
          return;
        }
        continue;
      }
      const visto = hostis(g).find((f) => herois().some((h) => podeVer(enc, h, f)));
      if (visto) {
        const quem = herois().find((h) => podeVer(enc, h, visto));
        const nossa = g.id === 'chefe';     // desavisado, Klarg pode ser surpreendido
        if (g.id === 'chefe' && !estado.klargAvisado && klarg && !klarg.dead) {
          // Klarg não é só um número: dá para falar com ele antes da luta (e a conversa pode comprar a surpresa).
          const fim = await app.conversarCom(klarg, arvoreKlarg());
          if (fim === 'sai') continue;
          await combate(g, fim === 'normal' ? null : 'nossa');
          return;
        }
        await asArmas([
          SALAS[g.id].clima,
          visaoNoEscuro(quem) && !emiteLuz(quem)
            ? `No cinza da visão no escuro, ${quem.name} vê movimento ${SALAS[g.id].em}: ${visto.name}${hostis(g).length > 1 ? ', e não está sozinho' : ''}.`
            : `A luz alcança ${SALAS[g.id].nome} e pega ${visto.name} desprevenido.`,
          nossa ? 'Eles ainda não perceberam vocês.' : 'Ninguém é surpreendido.',
        ]);
        await combate(g, nossa ? 'nossa' : null);
        return;
      }
      const notou = hostis(g).find((f) => herois().some((h) => nota(f, h)));
      if (notou) {
        const alvo = herois().find((h) => nota(notou, h));
        await asArmas(emiteLuz(alvo)
          ? `Do fundo do escuro, um grito agudo — a tocha de ${alvo.name} entregou o grupo antes de alguém ver qualquer coisa.`
          : `Alguma coisa raspa na pedra, perto. ${alvo.name} não vê nada — mas alguma coisa no escuro vê ${alvo.name}.`);
        await combate(g, g.id === 'chefe' && estado.subiuChamine ? 'nossa' : 'deles');
        return;
      }
    }
  }

  // ------------------------------------------------------------- área 2 ----
  async function vigias(g, c) {
    const postos = hostis(g);
    const naAgua = atravessou(enc.field, c.pos);
    if (!naAgua && !olhoDoPosto(enc.field, postos, c.pos)) return false;
    // Dois caminhos levam ao mesmo teste: molhar o pé no riacho, ou entrar pela boca debaixo do olho do posto.
    const molhou = naAgua || enc.field.surfaceAt(c.pos.x, c.pos.y) === 'riacho';
    // Quem chega com cuidado pode pegar os vigias distraídos.
    const r = rolarPericia(enc.rng, c, 'furtividade');
    const atencao = Math.max(...postos.map((f) => passivePerception(f)));
    const furtivo = r.total > atencao;
    const comoChegou = molhou
      ? [`${c.name} atravessa o riacho sem barulho e vê, entre o mato,`,
        `${c.name} atravessa o riacho e um galho estala. Do meio do mato, atrás de`]
      : [`${c.name} entra pela boca da caverna pela faixa seca, sem molhar o pé, e vê, ali do outro lado da água,`,
        `${c.name} entra pela boca da caverna e pisa num graveto. Ali do outro lado da água, atrás de`];
    await asArmas(furtivo
      ? [`${comoChegou[0]} um abrigo de ripas: dois goblins ali, um cochilando, o outro coçando a orelha, e um terceiro, mais largo, de costas, comendo alguma coisa.`,
        `Furtividade ${r.total}: os vigias não perceberam nada.`]
      : [`${comoChegou[1]} umas ripas de madeira, dois goblins se levantam de arco na mão, e um terceiro, mais largo, grita com eles.`,
        'Ninguém é surpreendido.']);
    await combate(g, furtivo ? 'nossa' : null);
    return true;
  }

  /** Barulho lá fora (descansar ali) chama os vigias, que atacam primeiro. */
  async function barulhoLaFora() {
    const g = grupos.vigias;
    if (!pendentes().includes(g) || !herois().every((h) => ['fora', 'vigias'].includes(salaDe(enc.field, h.pos)))) return false;
    await asArmas('Uma hora de conversa e panelas batendo é demais até para goblins preguiçosos: uma flecha sai do mato a leste do riacho, e outra.');
    await combate(g, 'deles');
    return true;
  }

  // ------------------------------------------------------------- área 3 ----
  /**
   * O canil não vira luta só por ser visto. Os lobos estão presos a um espeto
   * de ferro e não alcançam o túnel: de longe eles rosnam, e dá para tentar
   * acalmá-los. A briga começa quando alguém entra no alcance da corrente.
   *
   * Antes, o ramo genérico de `depoisDeMover` abria o combate assim que um
   * herói com visão no escuro os enxergava — e isso é inevitável, porque a
   * única fileira que liga o túnel ao canil (y=12) deixa os três à vista.
   * Medido: "Acalmar os lobos" nunca chegava a ser clicável.
   */
  async function canil(g) {
    const presos = hostis(g);
    if (!presos.length) return false;
    const naCorrente = presos.some((f) => herois().some((h) => (f.corrente
      ? distanceFt(f.corrente, h.pos) <= f.corrente.raioFt + 5
      : distanceFt(f.pos, h.pos) <= 10)));
    if (!naCorrente) {
      // Vistos de longe: rosnam uma vez, e o aviso diz o que dá para fazer.
      if (!estado.lobosRosnaram && presos.some((f) => herois().some((h) => podeVer(enc, h, f)))) {
        estado.lobosRosnaram = true;
        await narrar(root, { formato: 'painel', paginas: [{ texto: [
          'Um degrau acima, a leste do túnel, ferro raspa na pedra: três lobos magros se levantam e rosnam, presos por correntes a um espeto cravado no meio do chão. Nenhum deles alcança o túnel.',
          'Botão direito no canil para tentar acalmá-los — ou passe de longe, pelo riacho.',
        ] }] });
        app.refresh();
      }
      return false;
    }
    await asArmas('As correntes estalam: os três lobos se jogam para a frente até onde o ferro deixa, babando.');
    await combate(g, null);
    curiososDoCanil();
    return true;
  }

  // O BARULHO DO CANIL (o Obelisco): os goblins de perto ignoram rosnado, mas BRIGA com os lobos traz 1d4 deles para
  // ver, duas rodadas depois. Chegam pela passagem, do lado de baixo.
  function curiososDoCanil() {
    const n = enc.rng.die(4);
    const curiosos = Array.from({ length: n }, (_, i) => {
      const f = makeMonster('goblin', { ...PE.peDaPassagem }, { nameSuffix: `curioso ${'ABCD'[i]}` });
      f.grupo = 'canil';
      f.facingVec = { dx: 1, dy: 1 };
      return f;
    });
    grupos.canil.membros.push(...curiosos);
    let veio = false;
    enc.reinforcements = (rodada) => {
      if (veio || rodada < 3 || estado.lutando !== grupos.canil) return null;
      veio = true;
      return { units: curiosos, aviso: `${n === 1 ? 'Um goblin chega' : `${n} goblins chegam`} pela passagem para ver que barulho é esse.` };
    };
  }

  /** Os lobos acorrentados puxam a corrente quando veem alguém fora do alcance. */
  enc.antesDoTurno = (m) => {
    if (m.corrente && !m.dead) {
      const alcanca = herois().some((h) => distanceFt(m.corrente, h.pos) <= m.corrente.raioFt + 5);
      const ve = herois().some((h) => podeVer(enc, m, h));
      if (alcanca || !ve) return false;
      const cd = m.correnteCD ?? 15;
      const r = d20(enc.rng, abilityMod(m.abilities.str));
      if (r.total >= cd) {
        if (cd === 15) {
          m.correnteCD = 10;
          enc.say('acao', `${m.name} se joga contra a corrente (Força ${r.total}): o espeto de ferro afrouxa na pedra.`);
        } else {
          m.corrente = null;
          enc.say('acao', `${m.name} arranca o espeto do chão (Força ${r.total}) e está solto!`);
        }
      } else {
        enc.say('acao', `${m.name} puxa a corrente, rosnando (Força ${r.total} contra CD ${cd}).`);
      }
      return true;
    }
    // Klarg e a chaminé. Morto o Serrote ele ruge, mas ainda briga: só corre
    // quando perde METADE da vida. Com a fuga disparando na morte do lobo,
    // "matar o Serrote primeiro" virava a jogada dominante — medido em 1500
    // lutas: 99,1% de vitória contra 93,9%, e em 41% delas Klarg saía da
    // caverna sem ter dado um só golpe.
    // KLARG FOGE QUANDO NÃO SOBRA NINGUÉM DO LADO DELE (o Obelisco): os goblins e o Serrote lutam até a morte, e
    // caídos todos ele desce pela chaminé. A regra antiga (fugir com o lobo morto e meia vida) era nossa.
    if (m === klarg && !klarg.dead) {
      const aliados = grupos.chefe.membros.filter((f) => f !== klarg && enc.combatants.includes(f));
      if (!klarg.fugindo && aliados.every((f) => f.dead || hasCondition(f, 'inconsciente'))) {
        klarg.fugindo = true;
        enc.say('acao', 'Klarg olha em volta, não vê ninguém de pé do lado dele, e decide que esta caverna não vale a pele dele.');
      }
      if (klarg.fugindo) return fugirPelaChamine();
    }
    return false;
  };

  /** O chefe do posto caiu: os vigias que sobram fogem para o canil e soltam os lobos, que vêm para a briga. */
  function lobosSoltos() {
    if (estado.lobosSoltos || estado.lutando !== grupos.vigias) return;
    estado.lobosSoltos = true;
    const correm = hostis(grupos.vigias).filter((f) => !hasCondition(f, 'inconsciente'));
    for (const f of correm) {
      f.fugiu = true;
      const i = enc.combatants.indexOf(f);
      if (i >= 0) enc.combatants.splice(i, 1);
    }
    const lobos = hostis(grupos.canil).filter((f) => f.defId === 'lobo');
    if (correm.length && lobos.length) {
      for (const l of lobos) { l.corrente = null; l.grupo = 'vigias'; }
      grupos.vigias.membros.push(...lobos);
      grupos.canil.membros = grupos.canil.membros.filter((f) => !lobos.includes(f));
      // Entram já na luta, lá do canil: só agem no próximo turno do lado deles, e têm o caminho todo para correr.
      for (const l of lobos) if (!enc.combatants.includes(l)) enc.addCombatant(l);
      enc.say('acao', `Com o chefe no chão, ${correm.length > 1 ? 'os vigias largam os arcos e correm' : 'o vigia larga o arco e corre'} caverna adentro, gritando. Lá dentro, ferro raspa em pedra, e três lobos soltos vêm pela boca da caverna.`);
    } else if (correm.length) {
      enc.say('acao', `Com o chefe no chão, ${correm.length > 1 ? 'os vigias correm' : 'o vigia corre'} caverna adentro.`);
    }
    enc.checkEnd();
    app.refresh();
  }

  function acalmarLobos(c) {
    const g = grupos.canil;
    const comida = garantirInventario(c).bag.find((i) => i.id === 'racoes' && i.qtd > 0);
    const cd = comida ? 10 : 15;
    return async () => {
      if (comida) comida.qtd -= 1;
      const t = teste(c, 'lidarComAnimais', cd);
      // Falar com Animais: além da vantagem, dá para ouvir o que os lobos rosnam.
      const x = ctxDe(app, enc);
      if (ativaDe(x.estado, x.herois(), 'falarComAnimais')) {
        await narrar(root, { formato: 'painel', paginas: [{ titulo: 'Falar com Animais', texto: [
          `${c.name} entende o rosnado: "corrente machuca… carne seca cheira bem… o grande de pelo no queixo vai voltar… não grita, não corre, o grande de pelo não gosta de barulho".`,
        ] }] });
      }
      enc.say('acao', `${c.name} · Lidar com Animais: ${t.total} contra CD ${cd} — ${t.passou ? 'sucesso' : 'falha'}`);
      if (t.passou) {
        g.tregua = true;
        for (const f of g.membros) f.side = 'neutro';
        trazer(g);
        await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [comida
          ? `${c.name} joga a carne seca e fala baixo. Os lobos brigam pela comida, cheiram a mão estendida e deitam. Dá para passar.`
          : `${c.name} se agacha, fala baixo e não desvia o olhar. Os lobos param de rosnar, um por um. Dá para passar.`] }] });
        app.refresh();
      } else {
        await asArmas(`Os lobos não querem conversa: avançam até onde a corrente deixa, babando.`);
        await combate(g, null);
      }
    };
  }

  async function chamine(c, subir) {
    const t = teste(c, 'atletismo', 10);
    if (t.passou) {
      const destino = casaPerto(subir ? CHAMINE_TOPO : CHAMINE_BASE);
      c.pos = { ...c.pos, x: destino.x, y: destino.y };
      if (subir) estado.subiuChamine = true;
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [subir
        ? `${c.name} escala a chaminé apertada, nove metros de pedra úmida, e sai por uma abertura no lado oeste de uma caverna grande.`
        : `${c.name} desce a chaminé e chega ao fundo do canil, entre o lixo jogado lá de cima.`] }] });
    } else if (t.total >= 6) {
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [`${c.name} não acha onde segurar e não sai do lugar.`] }] });
    } else {
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'concussão');
      if (!c.dead) addCondition(c, 'caido');
      await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [`A pedra solta escorrega e ${c.name} cai no fundo da chaminé: ${dano} de dano.`] }] });
    }
    app.refresh();
    // Sair da chaminé NÃO abre a luta por si. A chaminé existe para flanquear,
    // e antes entregava um herói sozinho a 5 pés de um goblin e a 20 de Klarg:
    // medido, 68% de vitória e 46% de morte para quem subia primeiro. Quem sobe
    // no escuro encosta na pedra e espera; quem sobe de tocha acesa se entrega,
    // e aí vale o gatilho normal.
    if (subir && t.passou && !emiteLuz(c)) {
      await narrar(root, { formato: 'painel', paginas: [{ texto: [
        `${c.name} sai da chaminé e se encosta na pedra, no escuro, sem fazer barulho. Dá para subir o resto do grupo antes de ir em frente — mas basta um passo lá dentro para a caverna acordar.`,
      ] }] });
      return;
    }
    await depoisDeMover(c);
  }

  // ------------------------------------------------------------- área 4 ----
  // A LAJE DO RESSALTO é uma REGIÃO do mapa (`encounter.js`, `rules/regioes.js`): a Acrobacia de quem anda em cima, o
  // desabamento sobre a metade leste da passagem e o desenho dele são do motor. O capítulo conta a queda e liga o
  // ATAQUE: o Obelisco também a faz ceder com quem ataca corpo a corpo de cima dela (`evento`, tipo `attack`).
  const laje = () => enc.field.regioes?.find((r) => r.id === 'ressalto') ?? null;
  const naLaje = (p) => RESSALTO.some((q) => q.x === p.x && q.y === p.y);
  // A ENCOSTA: a subida de entulho do oeste, onde a cobra ataca com vantagem.
  const ENCOSTA = new Set([...RESSALTO.map((q) => `${q.x},${q.y}`), '8,6', '11,6']);

  /**
   * A laje cedeu sob alguém (a região disparou, no meio do passo): o painel conta o tombo, com o dano que o motor
   * tirou. Explorando, ele espera o passo acabar e vem ANTES de tudo o que o passo novo dispara (`depoisDeMover`) —
   * senão o goblin da ponte, que vê quem rolou até perto dele, falaria primeiro e a queda ficaria embaixo. Na luta
   * não há `depoisDeMover`: conta na hora.
   */
  function naRegiao(regiao, c, quando, resultado) {
    if (regiao.id !== 'ressalto') return;
    const outros = (resultado?.atingidos ?? []).filter((a) => a.quem !== c).map((a) => `${a.quem.name} (${a.dano}${a.passou === false ? ', no chão' : ''})`);
    estado.queda = { nome: c.name, dano: resultado?.dano ?? 0, caiu: resultado?.passou === false, outros };
    if (!estado.explorando) contarAQueda();
  }

  async function contarAQueda() {
    const q = estado.queda;
    if (!q) return;
    estado.queda = null;
    await narrar(root, { formato: 'painel', paginas: [{ texto: [
      `A laje sob ${q.nome} racha com um estalo, e a massa inteira de entulho se solta e despenca para leste, encosta abaixo: ${q.dano} de dano${q.caiu ? ', e no chão' : ''}.`,
      ...(q.outros.length ? [`A pedra pega também ${q.outros.join(', ')}.`] : []),
    ] }] });
    app.refresh();
  }

  // ------------------------------------------------------------- área 4 ----
  // A COBRA DO RESSALTO, que o Obelisco põe enrolada na laje rachada. Ela não se esconde com Furtividade: fica imóvel,
  // da cor do entulho, e a régua do livro é a Percepção passiva — 13 ou mais vê a cobra antes do bote, abaixo disso é
  // pego de surpresa. É por isso que `g.furtividade` vira [13] aqui, e o motor (`rolarSurpresa`) faz o resto, herói a
  // herói. Ela acorda com alguém a 15 pés e à vista (a mordida alcança 10). A briga faz barulho na subida, e o goblin
  // da ponte ouve: se ninguém ainda deu o sinal, ele assobia, e a enchente vem pela passagem como viria se ele os
  // tivesse visto.
  //
  // E o livro lhe dá VANTAGEM contra quem luta na encosta (`vantagemContraEm`, lido pelo motor nos ataques).
  const DESPERTA_A_COBRA_FT = 15;
  async function cobra(g) {
    const bicho = hostis(g)[0];
    if (!bicho) return false;
    const perto = herois().find((h) => distanceFt(h.pos, bicho.pos) <= DESPERTA_A_COBRA_FT
      && enc.field.hasLineOfSight(h.pos, bicho.pos));
    if (!perto) return false;
    g.furtividade = [13];
    bicho.vantagemContraEm = ENCOSTA;
    bicho.vantagemContraEmMotivo = 'na encosta';
    const viram = herois().filter((h) => passivePerception(h) >= 13);
    await asArmas([
      SALAS.cobra.clima,
      viram.length
        ? `${viram.map((h) => h.name).join(viram.length > 1 ? ' e ' : '')} ${viram.length > 1 ? 'veem' : 'vê'} a tempo: o que parecia uma dobra do entulho, na laje do meio da subida, é uma cobra do comprimento de dois homens, e ela já ergueu a cabeça.`
        : `O entulho na laje do meio da subida se desenrola. Uma cobra do comprimento de dois homens dá o bote em ${perto.name} antes que alguém entenda o que está vendo.`,
    ]);
    const sentinela = hostis(grupos.ponte)[0];
    if (sentinela && !grupos.ponte.ativo && !estado.enchentes && !estado.enchente) {
      estado.enchente = { turnos: 2 };
      enc.say('acao', 'Lá no alto, sobre o riacho, três assobios curtos: o barulho da briga chegou ao goblin da ponte.');
    }
    await combate(g, 'deles');
    return true;
  }

  // ------------------------------------------------------------- área 5 ----
  /**
   * O goblin da ponte, pelo Obelisco: bem escondido, só se vê com Percepção 15. Distraído como os outros: se ninguém
   * do grupo leva luz, quem passa debaixo dos olhos dele passa com Furtividade CD 12, um teste por herói. Luz à vista
   * dele, ou um teste falho, e ele dá o sinal da enchente e atira.
   */
  async function ponte(g) {
    const goblin = hostis(g)[0];
    if (!goblin) return false;
    const visto = herois().find((h) => podeVer(enc, h, goblin) && passivePerception(h) >= 15);
    const aVista = herois().filter((h) => podeVer(enc, goblin, h));
    let notou = aVista.find((h) => emiteLuz(h)) ?? null;
    if (!notou) {
      estado.passouPelaPonte ??= new Set();
      for (const h of aVista) {
        if (estado.passouPelaPonte.has(h.id)) continue;
        const r = rolarPericia(enc.rng, h, 'furtividade');
        if (r.total >= 12) {
          estado.passouPelaPonte.add(h.id);
          enc.say('acao', `${h.name} passa sem barulho por baixo da ponte (Furtividade ${r.total} contra CD 12).`);
        } else { notou = h; break; }
      }
    }
    if (!visto && !notou) return false;
    if (notou && !estado.enchentes) estado.enchente ??= { turnos: 2 };
    await asArmas(notou
      ? [`No alto, sobre uma ponte frágil de madeira e corda seis metros acima do riacho, um goblin assobia três vezes para o fundo da caverna e põe uma flecha na corda.`,
        visto ? 'Vocês o viram ao mesmo tempo.' : 'Ele viu vocês primeiro.']
      : [`${visto.name} distingue, lá no alto, uma ponte frágil de madeira e corda — e um goblin deitado nela, de olho no riacho.`]);
    await combate(g, notou && !visto ? 'deles' : null);
    return true;
  }

  /**
   * A enchente: desce dos poços pelo túnel até a boca. Pode haver uma
   * segunda, só por ordem do goblin da ponte, e só se a primeira não varreu
   * todos os intrusos da passagem.
   */
  async function enchente() {
    if (!estado.enchente || estado.enchentes >= 2) return;
    // O ASSOBIO VEM ANTES DA ÁGUA, e por um tempo não vinha. O gatilho já guardava `{ turnos: 2 }` — o atraso do
    // livro, que manda os goblins dos tanques romperem o dique ao sinal da ponte —, mas ninguém LIA o campo:
    // `enchente()` corria na primeira chamada depois do assobio, isto é, no passo seguinte. Dado morto, e a
    // armadilha da cena perdia o que a torna armadilha: os dois turnos em que dá para sair da passagem, subir nos
    // degraus do canil ou correr para a boca. Aqui o campo decide. `{ turnos: 0 }` (o dique rompido pelo próprio
    // grupo, em `interacoes`) continua caindo na hora, que aí a água já está vindo.
    if (estado.enchente.turnos > 0) {
      estado.enchente = { turnos: estado.enchente.turnos - 1 };
      enc.say('acao', estado.enchente.turnos > 0
        ? 'Lá no fundo da caverna, pedra raspando pedra: alguma coisa grande está sendo desencaixada.'
        : 'O barulho de água cresce no túnel lá em cima, e o riacho aos pés de vocês fica turvo de uma vez.');
      app.refresh();
      return;
    }
    estado.enchente = null;
    estado.enchentes += 1;
    const linhas = [];
    for (const c of enc.combatants.filter((x) => !x.dead && naPassagem(enc.field, x.pos))) {
      const r = enc.resistencia(c, 'dex', 10);
      if (r.success) { linhas.push(`${c.name} sai da frente da água (Destreza ${r.total}).`); continue; }
      const f = enc.resistencia(c, 'str', 15);
      if (f.success) { linhas.push(`${c.name} se agarra na pedra e aguenta (Força ${f.total}).`); continue; }
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'concussão');
      if (!c.dead) {
        addCondition(c, 'caido');
        const fora = casaPerto(PE.fozDaEnchente);
        c.pos = { ...c.pos, x: fora.x, y: fora.y };
      }
      linhas.push(`${c.name} é arrastado pela água até a boca da caverna: ${dano} de dano.`);
    }
    for (const t of linhas) enc.say('dano', t);
    esvaziarPoco(estado.enchentes);
    const sentinela = hostis(grupos.ponte)[0];
    if (estado.enchentes === 1 && sentinela && herois().some((h) => naPassagem(enc.field, h.pos))) {
      estado.enchente = { turnos: 2 };
      linhas.push('Lá em cima, o goblin da ponte olha a passagem, vê que ainda tem gente ali e assobia de novo.');
    }
    await narrar(root, { formato: 'painel', paginas: [{ texto: [
      'Lá do fundo, um estalo de pedra e o barulho cresce até virar rugido: uma onda escura desce pelo túnel, arrastando cascalho.',
      ...(linhas.length ? linhas : ['Ninguém estava no caminho da água.']),
    ] }] });
    app.refresh();
  }

  /** Cada enchente esvazia um tanque: o de baixo primeiro, depois o de cima. */
  function esvaziarPoco(qual) {
    const f = enc.field;
    const chao = SUPERFICIES.indexOf('caverna');
    for (const { x, y } of qual === 1 ? PE.poco1 : PE.poco2) {
      const i = y * f.w + x;
      if (f.surfaceAt(x, y) === 'poco') { f.surfaces[i] = chao; f.tiles[i] = 0; }
    }
    // a barragem desenhada estoura junto: a peça de arte do dique rompido (a FA a desenha em dois estágios)
    f.alternarSobreposicao?.(qual === 1 ? 'diqueRompido1' : 'diqueRompido2', true);
  }

  // ------------------------------------------------------------- área 6 ----
  /** No meio da luta do covil, perdendo, Yeemik pede trégua com a faca no refém. */
  async function tregua() {
    estado.tregaFeita = true;
    const fim = await app.conversarCom(yeemik, arvoreYeemik('tregua'));
    await depoisDoYeemik(fim);
  }

  async function depoisDoYeemik(fim) {
    const g = grupos.covil;
    if (fim === 'acordo' || fim === 'paz' || fim === 'solto' || fim === 'pago') {
      if (fim === 'acordo') estado.acordo = true;
      if (fim === 'solto' || fim === 'pago') libertarSildar(fim === 'pago'
        ? 'Yeemik conta as moedas duas vezes, corta a corda de Sildar e o empurra escada abaixo.'
        : 'Yeemik corta a corda de Sildar com o punhal e o empurra escada abaixo.');
      g.tregua = true;
      for (const f of hostis(g)) f.side = 'neutro';
      // No meio da luta, a trégua a encerra: sem inimigo de pé, o motor fecha.
      if (estado.lutando === g && !enc.over) { enc.checkEnd(); return; }
      if (podeEncerrar()) { await fimDoCapitulo(['Vocês saem do covil com Sildar entre vocês. Atrás, Yeemik já grita ordens aos goblins que sobraram.']); return; }
      if (!estado.lutando) prepararExploracao();
      return;
    }
    // Recusa: Yeemik joga Sildar do ressalto.
    for (const f of g.membros) if (f.side === 'neutro' && f !== sildar) f.side = 'foes';
    g.tregua = false;
    if (sildar && !estado.sildarLivre && !sildar.dead) {
      const dano = enc.rng.die(6);
      sildar.hp = 0;
      sildar.stable = false;
      addCondition(sildar, 'inconsciente');
      const baixo = casaPerto(PE.baixoDoCovil);
      sildar.pos = { ...sildar.pos, x: baixo.x, y: baixo.y };
      enc.say('dano', `Yeemik joga Sildar do alto do ressalto: ${dano} de dano. Sildar está morrendo — estabilize-o.`);
    }
    if (estado.lutando !== g) await combate(g, null);
    app.refresh();
  }

  /** Klarg resolvido, o baú achado e Sildar fora das mãos de Yeemik (livre ou morto). */
  const podeEncerrar = () => grupos.chefe.vencido && estado.bauAchado
    && (estado.sildarLivre || !sildar || sildar.dead) && !estado.encerrado;

  function libertarSildar(texto) {
    if (!sildar || estado.sildarLivre) return;
    estado.sildarLivre = true;
    if (texto) enc.say('acao', texto);
    const lugar = casaPerto(PE.baixoDoCovil);
    sildar.pos = { ...sildar.pos, x: lugar.x, y: lugar.y };
    sildar.refem = false;
    app.refresh();
  }

  // O resgate sai do dinheiro do GRUPO, em qualquer moeda e com troco: ler só
  // `moedaDeOuro` fazia o jogo ver 18 po onde o grupo carregava 89 em valor —
  // as 600 de cobre e 110 de prata do baú de Klarg não contavam.
  const ouroDoGrupo = () => Math.floor(totalEmCobre(herois()) / 100);
  const pagar = (qtd) => cobrar(herois(), qtd * 100);

  // O resgate que Yeemik cobra é nosso número: a aventura só diz que é alto.
  const RESGATE = 50;

  // KLARG fala de si na terceira pessoa e se acha rei. A conversa nunca dá nada de graça: pode comprar a surpresa (Intimidação ou
  // Enganação), custar a surpresa (conversa que falha: luta normal) ou deixar o grupo recuar.
  function arvoreKlarg() {
    return {
      inicio: 'oi',
      nos: {
        oi: {
          narra: `${SALAS.chefe.clima} O vulto levanta a cabeça devagar. Os olhos pequenos acham o grupo antes que alguém consiga recuar.`,
          fala: ['Klarg! Klarg manda aqui. Klarg não gosta de gente que entra sem bater, e Klarg gosta ainda menos de gente que sai.',
            'Quem manda vocês? Foi o verme do Yeemik? Klarg sabe que foi o verme do Yeemik.'],
          opcoes: [
            { texto: 'Saia daqui com os seus, Klarg. Hoje ninguém precisa morrer.', teste: { pericia: 'intimidacao', cd: 14 }, sucesso: 'recua', falha: 'ri' },
            { texto: 'Yeemik está vindo com o bando inteiro. Esconda-se, Klarg: ele quer o seu trono.', teste: { pericia: 'enganacao', cd: 13 }, sucesso: 'cai', falha: 'ri' },
            { texto: 'Sacar as armas.', fim: 'nossa' },
            { texto: 'Recuar em silêncio, antes que ele se levante.', fim: 'sai' },
          ],
        },
        recua: {
          narra: 'Klarg hesita. A mão enorme larga o osso que roía, e por um instante a boca fica aberta, sem resposta.',
          fala: 'Klarg não tem medo! Klarg só está… pensando.',
          opcoes: [{ texto: 'Aproveitar a hesitação.', fim: 'nossa' }],
        },
        cai: {
          narra: 'O vulto se vira para a entrada que vocês não vigiam e rosna, o corpo inteiro em direção ao lado errado.',
          fala: 'O verme! Klarg sabia! Klarg vai esmagar o verme quando ele…',
          opcoes: [{ texto: 'Atacar enquanto ele olha para o outro lado.', fim: 'nossa' }],
        },
        ri: {
          narra: 'Klarg gargalha, uma risada molhada que sacode as peles nas paredes.',
          fala: 'Klarg não é bobo! Klarg conta com os dedos: um, dois, três, quatro… e Klarg tem mais amigos que dedos!',
          opcoes: [{ texto: 'Às armas.', fim: 'normal' }],
        },
      },
    };
  }

  function arvoreYeemik(inicio) {
    return {
      inicio,
      nos: {
        tregua: {
          narra: 'O goblin magro lá em cima agarra o homem amarrado pelos cabelos, arrasta-o até a beira do ressalto e encosta o punhal no pescoço dele. Os goblins de baixo param, ofegantes.',
          fala: [
            'Trégua! Trégua, ou o humano morre!',
            'Yeemik não quer briga com vocês. Yeemik quer o lugar de Klarg, o grandalhão fedido que manda aqui. Tragam a cabeça de Klarg e o humano é de vocês.',
          ],
          opcoes: [
            { texto: 'Combinado. Onde está o Klarg?', vai: 'acordo' },
            // Zona da Verdade: o "combinado" dele é mentira, e sob a magia ele não a sustenta.
            { texto: 'Jure aqui, na Zona da Verdade: o humano é nosso só com a cabeça de Klarg, sem resgate.', zona: true, oculta: true, vai: 'jura' },
            // Línguas: de chefe para chefe, no idioma dele.
            { texto: 'Falar com ele em goblin, de chefe para chefe: soltar o homem agora o faz parecer forte.', magia: 'linguas', magiaNome: 'Línguas', oculta: true,
              teste: { pericia: 'persuasao', cd: 15, vantagem: true }, sucesso: 'solta', falha: 'nao' },
            { texto: 'Solte o homem agora, como prova. A gente cuida do Klarg de qualquer jeito.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'solta', falha: 'nao' },
            { texto: 'Solte ele, ou ninguém nesta sala vê o sol de novo.', teste: { pericia: 'intimidacao', cd: 15 }, sucesso: 'solta', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        acordo: {
          narra: 'Do chão, com a boca inchada, o homem amarrado murmura: — Não confiem nele.',
          fala: 'Gente esperta! Klarg mora no fundo, no leste, depois dos poços. Voltem com a cabeça e o humano é de vocês.',
          // Sob a Zona da Verdade, o "de vocês" cai: depois da cabeça vem o resgate.
          zona: { fala: 'Klarg mora no fundo, no leste, depois dos poços. Voltem com a cabeça… e depois Yeemik cobra ouro pelo humano. Cobra, cobra! Yeemik não consegue dizer que não cobra.' },
          fim: 'acordo',
        },
        jura: {
          narra: 'A Zona da Verdade aperta a garganta de Yeemik: ele tenta jurar que não cobra nada e só sai um engasgo.',
          fala: 'Yeemik… Yeemik não pode dizer isso! Yeemik cobra, cobra ouro, o humano comeu a comida de Yeemik! Mas Yeemik só quer o lugar do Klarg, de verdade, de verdade!',
          opcoes: [
            { texto: 'Então solte o homem agora, sem ouro, e a cabeça de Klarg sai de graça.', teste: { pericia: 'persuasao', cd: 10 }, sucesso: 'solta', falha: 'nao' },
            { texto: 'Combinado. A cabeça, e o resgate depois.', vai: 'acordo' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        nao: {
          fala: 'Prova? Yeemik é que quer prova. Cabeça primeiro, humano depois.',
          opcoes: [
            { texto: 'Está bem. Combinado.', vai: 'acordo' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        solta: {
          fala: 'Tá, tá! Leva o velho. Mas a cabeça continua valendo, ouviu? Yeemik espera.',
          fim: 'solto',
        },
        furia: {
          narra: 'Os olhos de Yeemik se apertam.',
          fala: 'Ninguém ameaça Yeemik na casa de Yeemik!',
          fim: 'luta',
        },
        espera: {
          fala: 'Ainda aqui? A cabeça, a cabeça! Klarg está no fundo, no leste.',
          opcoes: [
            { texto: 'Já vamos.', fim: 'paz' },
            { texto: 'Mudamos de ideia. Atacar.', fim: 'luta' },
          ],
        },
        volta: {
          narra: 'Yeemik desce a escada aos pulos quando vê o que vocês carregam — e para, sorrindo demais.',
          fala: [
            'Klarg morto! Agora Yeemik é o chefe!',
            `Mas o humano… o humano comeu a comida de Yeemik. Bebeu a água de Yeemik. Isso custa. ${RESGATE} peças de ouro, e ele é de vocês.`,
          ],
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'O acordo era a cabeça. Solte ele.', teste: { pericia: 'persuasao', cd: 15 }, sucesso: 'cede', falha: 'teima' },
            { texto: 'Solte ele, ou você vai junto com o Klarg.', teste: { pericia: 'intimidacao', cd: 12 }, sucesso: 'cede', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        semCabeca: {
          fala: 'Klarg fugiu? Sem cabeça, sem humano! Yeemik não é bobo.',
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'Solte ele, ou você vai atrás do Klarg.', teste: { pericia: 'intimidacao', cd: 15 }, sucesso: 'cede', falha: 'furia' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        adeus: {
          fala: 'O humano já é de vocês. Agora saiam da casa de Yeemik, antes que Yeemik mude de ideia.',
          opcoes: [
            { texto: 'Ir embora.', fim: 'paz' },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
        cede: {
          fala: 'Tá bom, tá bom! Leva! Yeemik é generoso, Yeemik é o chefe!',
          fim: 'solto',
        },
        teima: {
          fala: `Acordo é acordo, e o preço é ${RESGATE}. Ou nada de humano.`,
          opcoes: [
            { texto: `Pagar ${RESGATE} peças de ouro.`, fim: 'pago',
              requer: () => (ouroDoGrupo() >= RESGATE ? null : `o grupo tem só ${ouroDoGrupo()} po`),
              efeito: () => pagar(RESGATE) },
            { texto: 'Atacar.', fim: 'luta' },
          ],
        },
      },
    };
  }

  // ------------------------------------------------------------- área 8 ----
  /** Klarg corre para a chaminé; chegando nela, some. Devolve true se gastou o turno. */
  function fugirPelaChamine() {
    if (distanceFt(klarg.pos, CHAMINE_TOPO) <= 5) {
      // A boca da chaminé é estreita para um bugbear: Destreza CD 10, e quem falha fica entalado (contido) — tenta de
      // novo no turno seguinte, com a ação.
      const r = d20(enc.rng, abilityMod(klarg.abilities.dex));
      if (r.total < 10) {
        if (!hasCondition(klarg, 'contido')) addCondition(klarg, 'contido', { rounds: Infinity, source: 'chamine' });
        enc.say('acao', `Klarg tenta se espremer pela chaminé e entala nos ombros (Destreza ${r.total} contra CD 10).`);
        app.refresh();
        return true;
      }
      klarg.fugiu = true;
      estado.klargFugiu = true;
      enc.combatants.splice(enc.combatants.indexOf(klarg), 1);
      enc.say('acao', 'Klarg se espreme pela chaminé do oeste e desaparece no escuro, xingando.');
      enc.checkEnd();
      app.refresh();
      return true;
    }
    const alcance = enc.reachableFor(klarg);
    let melhor = null;
    for (const n of alcance.values()) {
      if (enc.occupied(n.x, n.y, klarg)) continue;
      const d = distanceFt(n, CHAMINE_TOPO);
      if (!melhor || d < melhor.d) melhor = { n, d };
    }
    if (melhor && melhor.n.cost > 0) enc.moveAlong(klarg, Battlefield.pathFrom(alcance, melhor.n));
    return true;
  }

  function achouOBau(c) {
    // A trava seca e a tampa girando, um som que estava composto desde sempre
    // sem ninguém o pedir. Este e os dois da mansão (`capitulo3-mansao.js`) o
    // tocam; a arca do dragão, a do castelo e o baú do cume continuam calados,
    // porque os arquivos deles estão em obra de outra frente.
    audio.play('chestOpen');
    estado.bauAchado = true;
    enc.field.alternarSobreposicao?.('bauAberto', true);
    for (const [id, qtd] of [['moedaDeCobre', 1700], ['moedaDePrata', 150], ['pocaoDeCura', 2], ['estatuetaDeSapo', 1]]) guardar(c, id, qtd);
    return narrar(root, { formato: 'painel', paginas: [{ texto: [
      `Entre sacos e caixotes com a marca de um leão azul, ${c.name} acha um baú destrancado: 1.700 peças de cobre, 150 de prata, duas poções de cura e um sapinho de jade com olhos de ouro.`,
      'O resto — comida, ferramentas, lonas — é muito para carregar sem uma carroça. A marca é de uma companhia mercante de Phandalin.',
    ] }] });
  }

  // ----------------------------------------------------------- eventos ----
  /**
   * A FOGUEIRA (covil e Klarg): brasa no chão. Quem entra leva 1 de dano de
   * fogo; quem cai em cima, 1d6. Cada um, no máximo uma vez por turno.
   */
  function fogueira(ev) {
    const turno = `${enc.round}:${enc.side}:${estado.explorando ? 'x' : 'c'}`;
    // Só a brasa ACESA queima: quem abafou a fogueira (`game/fogo.js`) pode pisar nela.
    const naBrasa = (c) => fogueiraAcesa(enc.field, c.pos.x, c.pos.y);
    if (ev.type === 'moved' && ev.actor && !ev.actor.dead && naBrasa(ev.actor) && ev.actor._brasa !== turno) {
      ev.actor._brasa = turno;
      enc.applyDamage(ev.actor, 1, 'fogo');
      enc.say('dano', `${ev.actor.name} pisa na brasa da fogueira: 1 de dano de fogo.`);
    }
    for (const c of enc.combatants) {
      if (c.dead || !naBrasa(c) || !hasCondition(c, 'caido') || c._brasaCaido === turno) continue;
      c._brasaCaido = turno;
      const dano = enc.rng.die(6);
      enc.applyDamage(c, dano, 'fogo');
      enc.say('dano', `${c.name} está caído em cima da brasa: ${dano} de dano de fogo.`);
    }
  }

  /** O que o motor conta durante a luta (via `main.js`). */
  function evento(ev) {
    fogueira(ev);
    // ATACAR DE CIMA DA LAJE também a faz ceder (o Obelisco): Acrobacia CD 10 de quem ataca corpo a corpo dali.
    if (ev.type === 'attack' && !ev.ranged && ev.attacker?.side === 'party' && ev.attacker.pos && naLaje(ev.attacker.pos)) {
      const r = laje();
      if (r && !r.desligada) disparar(enc, r, ev.attacker, 'atacar');
    }
    // O CHEFE DO POSTO CAI, e os goblins dele correm para o canil soltar os lobos (o Obelisco).
    if (ev.type === 'died' && ev.target?.chefeDoPosto && estado.lutando === grupos.vigias) setTimeout(() => lobosSoltos(), 0);
    if (ev.type === 'died' && ev.target === serrote && klarg && !klarg.dead) {
      enc.say('acao', 'Klarg vê o Serrote cair e ruge, com os dentes à mostra. Ele não corre: fica.');
    }
    // AVISAR KLARG custa um turno de goblin. Antes, começar a luta dos poços já
    // o deixava avisado, mesmo que os três caíssem na primeira rodada — e o
    // ramo "Klarg desavisado" virava código morto. Agora alguém precisa estar
    // de pé, não cativado e com a vez chegando para gritar.
    // O Obelisco: a cachoeira abafa a briga entre os poços e a caverna de Klarg, e quem avisa é um goblin que LARGA a
    // luta e corre para lá. Sai do tabuleiro e vai para junto do Klarg, onde o grupo o reencontra.
    if (ev.type === 'sideStart' && ev.side === 'foes' && estado.lutando === grupos.pocos && !estado.klargAvisado) {
      const corre = hostis(grupos.pocos).find((f) => f.defId === 'goblin' && !hasCondition(f, 'cativado') && !hasCondition(f, 'inconsciente') && !hasCondition(f, 'contido'));
      if (corre) {
        estado.klargAvisado = true;
        enc.say('acao', `${corre.name} larga a briga e corre para o fundo da caverna, gritando em goblin.`);
        const i = enc.combatants.indexOf(corre);
        if (i >= 0) enc.combatants.splice(i, 1);
        grupos.pocos.membros.splice(grupos.pocos.membros.indexOf(corre), 1);
        corre.grupo = 'chefe';
        corre.pos = { ...corre.pos, ...casaPerto({ x: klarg?.pos.x ?? 26, y: (klarg?.pos.y ?? 13) - 1 }) };
        grupos.chefe.membros.push(corre);
        enc.checkEnd();
      }
    }
    if (ev.type === 'sideStart' && ev.side === 'foes' && estado.enchente) {
      estado.enchente.turnos -= 1;
      if (estado.enchente.turnos <= 0) setTimeout(() => enchente(), 0);
    }
    if (ev.type === 'sideStart' && ev.side === 'party' && estado.lutando === grupos.covil
      && !estado.tregaFeita && yeemik && !yeemik.dead && sildar && !sildar.dead && !estado.sildarLivre) {
      // "Ganhando": mais da metade dos goblins de baixo caiu.
      const caidos = grupos.covil.membros.filter((f) => f.defId === 'goblin' && (f.dead || hasCondition(f, 'inconsciente'))).length;
      if (caidos >= 3) setTimeout(() => tregua(), 0);
    }
  }

  // ------------------------------------------------------------ depois ----
  async function fimDoCombate(outcome) {
    const g = estado.lutando;
    if (outcome !== 'vitoria') {
      estado.encerrado = true;
      const v = await narrar(root, {
        formato: 'tela',
        paginas: [{ titulo: 'O escuro venceu', texto: ['O grupo caiu no esconderijo. Os goblins vão comer bem esta noite.'] }],
        escolhas: [
          { rotulo: 'Voltar ao menu', valor: 'menu' },
          { rotulo: 'Tentar o esconderijo de novo', valor: 'denovo', primaria: true },
        ],
      });
      if (v === 'denovo') app.newEncounter({ ...config, pularAbertura: true, continuarCom: null });
      else app.encerrarPartida();
      return;
    }
    // A enchente já estava a caminho: desce mesmo que a luta tenha acabado.
    if (estado.enchente) await enchente();
    const texto = [];
    let subiram = [];     // quem passou de nível com a parcela de XP desta sala (a tela vem depois do texto que explica o XP)
    if (g?.tregua) {
      texto.push(estado.sildarLivre
        ? 'A trégua vale. Sildar está livre, e Yeemik ainda quer a cabeça de Klarg.'
        : 'A trégua vale: os goblins do covil abaixam as armas. Yeemik espera a cabeça de Klarg, com Sildar amarrado ao lado.');
    } else {
      if (g) g.vencido = true;
      // Os 275 do esconderijo chegam aos poucos, na ordem em que o grupo o limpa: sem isso o 2º nível (300) só vinha com o
      // chefe morto, e o covil e o Klarg eram lutados por heróis de 1º nível, os dois encontros que derrotavam o grupo.
      const parcela = PARCELAS_DO_ESCONDERIJO[g?.id];
      if (parcela) {
        const aPagar = enc.combatants.filter((c) => c.side === 'party' && !c.dead && !c.marcos?.includes(`esconderijo-${g.id}`));
        for (const c of aPagar) (c.marcos ??= []).push(`esconderijo-${g.id}`);
        const sobem = darXp(aPagar, parcela);
        if (aPagar.length) texto.push(`Cada herói ganha ${parcela} XP por limpar ${SALAS[g.id]?.nome ?? 'a sala'} (agora ${aPagar[0].xp}).`);
        subiram = sobem;
      }
      if (g?.id === 'covil') {
        // A algibeira de Yeemik fica NO CORPO dele (`TESOURO_POR_INIMIGO.yeemik`): botão direito nele, "Revistar o
        // corpo". Antes ela ia direto para o primeiro herói, e o corpo não tinha o que revistar.
        if (yeemik?.dead) texto.push('Yeemik caiu com uma algibeira presa ao cinto, que tilinta quando o corpo assenta.');
        if (sildar && !sildar.dead) {
          libertarSildar(null);
          texto.push(sildar.hp > 0
            ? 'Vocês cortam as cordas de Sildar. Ele mal fica de pé, mas está vivo.'
            : 'Sildar está caído e desacordado, mas respira. Cortem as cordas e cuidem dele.');
        }
      } else if (g?.id === 'chefe') {
        texto.push(estado.klargFugiu
          ? 'Klarg escapou pela chaminé. A caverna é de vocês — e, entre os suprimentos, deve haver o que ele guardava.'
          : 'Klarg está morto. Entre os suprimentos empilhados no sul da caverna deve haver o que ele guardava.');
      } else {
        texto.push(`Silêncio ${SALAS[g?.id]?.em ?? 'na sala'} de novo.`);
      }
    }
    if (podeEncerrar()) {
      for (const tx of subiram.length ? await telaDeSubirNivel(root, subiram) : []) enc.say('cura', tx);
      await fimDoCapitulo(texto);
      return;
    }
    texto.push('Dá para descansar agora (botão direito num herói) antes de seguir.');
    await narrar(root, { formato: 'painel', paginas: [{ texto }] });
    if (subiram.length) for (const tx of await telaDeSubirNivel(root, subiram)) enc.say('cura', tx);
    prepararExploracao();
  }

  async function fimDoCapitulo(texto) {
    estado.encerrado = true;
    const vivo = sildar && !sildar.dead;
    // O marco do livro: 275 XP para cada um ao limpar o esconderijo.
    const grupo = enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    // O 275 só se paga uma vez por herói: carregar um save feito depois dele reentra o esconderijo.
    // O que cada um ainda não recebeu das salas (as que o grupo pulou, ou em que ele estava caído) sai daqui.
    const restoDe = (c) => 275 - Object.entries(PARCELAS_DO_ESCONDERIJO).reduce((n, [id, x]) => n + (c.marcos?.includes(`esconderijo-${id}`) ? x : 0), 0);
    const aPagar = grupo.filter((c) => !c.marcos?.includes('esconderijoLimpo'));
    for (const c of aPagar) (c.marcos ??= []).push('esconderijoLimpo');
    const sobem = [];
    for (const c of aPagar) sobem.push(...darXp([c], restoDe(c)));
    const resto = aPagar.length ? Math.max(...aPagar.map(restoDe)) : 0;
    texto = [...texto, resto ? `Cada herói ganha o que faltava dos 275 XP do esconderijo (agora ${grupo[0]?.xp ?? 0}).` : `Os 275 XP do esconderijo já estão com todos (agora ${grupo[0]?.xp ?? 0}).`];
    await narrar(root, { formato: 'tela', paginas: [{ titulo: 'O esconderijo caiu', texto }] });
    if (sobem.length) for (const t of await telaDeSubirNivel(root, sobem)) enc.say('cura', t);
    app.campanha = {
      ...(app.campanha ?? {}),
      // `suprimentosDaCompanhia` é SEMPRE verdadeiro aqui, e é de propósito. Houve uma tentativa de amarrá-lo
      // à carroça do capítulo 1 — "a Linene não paga quem perdeu a carroça" —, e era erro: a carga da Escudo
      // Leão não é a carroça do Gundren. São os sacos e caixas com o leão azul da ÁREA 8, debaixo dos quais
      // está o baú do Klarg, e `podeEncerrar` exige `estado.bauAchado`: quem termina o capítulo esteve lá e
      // viu. O livro paga as 50 po por trazer a carga OU por dizer onde ela está, e as duas coisas valem para
      // quem viu. A carroça decide só o TEXTO, logo abaixo: sem ela, a carga fica no lugar e o grupo vai
      // contar onde.
      capitulo2: { sildar: vivo, acordoComYeemik: estado.acordo, klargFugiu: estado.klargFugiu,
        suprimentosDaCompanhia: true },
    };
    await narrar(root, {
      formato: 'tela',
      paginas: [
        {
          titulo: 'Fim do segundo capítulo',
          texto: [
            vivo
              ? 'Sildar Hallwinter anda devagar, apoiado em quem o deixar apoiar-se, mas anda. Pela estrada ele conta o resto do que arrancou dos goblins no escuro: um nome, Aranha Negra, que foi quem pagou; um destino, o Castelo Dentefino, para onde o anão e o mapa seguiram. E faz uma oferta — cinquenta peças de ouro para chegar a Phandalin com companhia.'
              : 'Do anão, nenhum sinal: foi levado para outro lugar. A trilha volta para a estrada, e a estrada leva a Phandalin.',
            app.campanha?.capitulo1?.carroca
              ? 'Os sacos com a marca do leão azul cabem na carroça, apertados, e vão de volta para quem os perdeu. A estrada leva a Phandalin.'
              : 'Os sacos com a marca do leão azul ficam onde estão: sem carroça, não há como levá-los. Dá para dizer à dona deles onde foram parar — ela que mande buscar. A estrada leva a Phandalin.',
          ],
        },
      ],
      escolhas: [{ rotulo: 'Seguir para Phandalin', valor: 'vila', primaria: true }],
    });
    app.irParaVila(enc.combatants.filter((c) => c.side === 'party' && !c.dead), { chegando: true });
  }

  // --------------------------------------------------------- conversas ----
  const sildarArvore = {
    inicio: 'oi',
    nos: {
      oi: {
        fala: () => (estado.sildarLivre && sildar.hp > 0
          ? ['Sildar Hallwinter. Fico devendo a vida a vocês, e devo explicações — começando pela que menos me agrada: eu vim a Phandalin atrás de um homem, e só descobri que não ia achá-lo quando já estava amarrado aqui.',
            'O homem é Iarno Albrek. Mago, colega meu na Aliança dos Lordes, mandado à vila antes de mim para ver o que se podia fazer por ela. Nunca mais escreveu. Ninguém na vila diz tê-lo visto.',
            'Quanto ao anão: foi um serviço encomendado, não um assalto de estrada. Os goblins o levaram, e ao mapa dele, para um lugar que chamam de Castelo Dentefino, por ordem de alguém a quem chamam de Aranha Negra. Gundren e os irmãos tinham achado a entrada de uma mina perdida, e alguém queria muito que ela não fosse deles.',
            'Mas isso é conversa para a estrada. Antes, esta caverna precisa ficar limpa.']
          : ['…água. Alguém tem água?']),
        opcoes: [
          { texto: 'Quem estava com os goblins que pegaram vocês?', vai: 'estranho', uma: true, requer: () => (estado.sildarLivre && sildar.hp > 0 ? null : 'ele mal fala') },
          { texto: 'Fique aqui. Voltamos para buscar você.', fim: 'paz' },
        ],
      },
      // O FIO DO OBELISCO no covil: é o SILDAR quem o conta (o livro, "interpretando Sildar").
      estranho: {
        ao: () => {
          const vila = ((app.campanha ??= {}).vila ??= { pistas: [], missoes: {} });
          const t = 'Goblins de fora: um goblin de cabeça comprida andava com o bando que pegou Sildar. Os Cragmaw não o conheciam, e ele sussurrou ao Sildar um nome, Ruxithid.';
          if (!(vila.pistas ??= []).includes(t)) vila.pistas.push(t);
        },
        fala: [
          'Um deles não era do bando. Goblin, sim, mas de cabeça comprida, esticada para trás como se alguém a tivesse puxado ainda mole. Os outros abriam caminho para ele e não sabiam o nome dele — dava para ver.',
          'Ele chegou perto enquanto me amarravam, me olhou como quem confere uma mercadoria e cochichou: "não é você que o Ruxithid quer". Depois foi embora sozinho, mato adentro. Não sei quem é Ruxithid. Não gostei de ouvir o nome.',
        ],
        opcoes: [{ texto: 'Fique aqui. Voltamos para buscar você.', fim: 'paz' }],
      },
    },
  };

  function dialogoDe(npc) {
    if (npc === sildar) return sildarArvore;
    if (npc === yeemik && grupos.covil.tregua) {
      const inicio = estado.sildarLivre ? 'adeus'
        : estado.klargFugiu ? 'semCabeca' : grupos.chefe.vencido ? 'volta' : 'espera';
      return arvoreYeemik(inicio);
    }
    return null;
  }

  async function depoisDaConversa(npc, fim) {
    if (npc === yeemik) await depoisDoYeemik(fim);
  }

  // ------------------------------------------------------- botão direito ----
  function interacoes(tile, sup, c) {
    if (!c || !estado.explorando) return [];
    const ops = [];
    const longe = (pes) => (distanceFt(c.pos, tile) > pes ? `longe demais — chegue a ${pes} pés` : null);

    // Escutar: o barulho da água abafa tudo; Percepção CD 15 ouve as salas perto.
    if (sup === 'rocha') {
      ops.push({
        rotulo: 'Escutar', icone: 'acao-procurar', detalhe: 'Percepção, CD 15 · a água abafa tudo',
        // Uma tentativa por herói em cada ponto de escuta. Sem isso a opção não
        // custava nada, não marcava nada e não tinha alcance: dava para clicar
        // na mesma rocha até passar na CD 15, o que é o mesmo que não ter CD.
        // Outro herói pode tentar — são outros ouvidos —, o mesmo não.
        motivo: longe(5) ?? buscas.ja(c, 'escuta', tile),
        fazer: async () => {
          buscas.marcar(c, 'escuta', tile);
          const t = teste(c, 'percepcao', 15);
          const perto = pendentes().filter((g) => hostis(g).some((f) => distanceFt(f.pos, c.pos) <= 50));
          await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [t.passou
            ? (perto.length ? `Por baixo do barulho da água, ${c.name} distingue: ${perto.map((g) => ({ canil: 'correntes e rosnados', vigias: 'cochichos no mato', ponte: 'madeira rangendo lá em cima', covil: 'risadas e panela batendo', pocos: 'vozes perto de uma cachoeira', chefe: 'uma voz grossa falando de si mesma' }[g.id])).join('; ')}.` : `${c.name} escuta com atenção: só água.`)
            : `${c.name} só ouve água correndo.`] }] });
        },
      });
    }
    // Área 3: acalmar os lobos, e a chaminé.
    const g3 = grupos.canil;
    if (salaDe(enc.field, tile) === 'canil' && !g3.vencido && !g3.tregua) {
      const comida = garantirInventario(c).bag.some((i) => i.id === 'racoes' && i.qtd > 0);
      ops.push({
        rotulo: 'Acalmar os lobos', icone: 'acao-ajudar',
        detalhe: `Lidar com Animais, CD ${comida ? '10 (com comida)' : '15'}${ativaDe(ctxDe(app, enc).estado, herois(), 'falarComAnimais') ? ' · vantagem (Falar com Animais)' : ''}`,
        motivo: longe(30), fazer: acalmarLobos(c),
      });
    }
    if (sup === 'entulho' && tile.x === CHAMINE_BASE.x && tile.y === CHAMINE_BASE.y) {
      ops.push({ rotulo: 'Subir a chaminé', icone: 'acao-levantarSe', detalhe: 'Atletismo, CD 10 · 9 m até outra caverna', motivo: longe(5), fazer: () => chamine(c, true) });
    }
    if (sup === 'entulho' && tile.x === CHAMINE_TOPO.x && tile.y === CHAMINE_TOPO.y) {
      ops.push({ rotulo: 'Descer a chaminé', icone: 'acao-levantarSe', detalhe: 'Atletismo, CD 10 · 9 m até o canil', motivo: longe(5), fazer: () => chamine(c, false) });
    }
    // Área 8: o baú entre os suprimentos.
    if ((sup === 'mantimentos' || sup === 'bau') && DENTRO_DO_KLARG(enc.field, tile) && !estado.bauAchado) {
      ops.push({
        rotulo: 'Revirar os suprimentos', icone: 'acao-procurar', detalhe: 'sacos e caixotes roubados',
        motivo: longe(5) ?? (pendentes().includes(grupos.chefe) ? 'Klarg ainda está aqui' : null),
        fazer: async () => {
          await achouOBau(c);
          if (podeEncerrar()) await fimDoCapitulo(['O esconderijo é de vocês.']);
        },
      });
    }
    // Área 5: cortar as cordas da ponte, das pontas dela. A ponte continua de
    // pé (é corda e prancha, e só um dos cabos cede): quem está em cima é que
    // despenca os 6 m no canal. Derrubar a ponte inteira travaria o capítulo —
    // ela é o único caminho do anel para os poços. MEDIDO, para quem vier
    // propor os 10 PV e a CA 5 que o livro dá à ponte: trocando as duas casas
    // de `ponte` por rocha e inundando o mapa da chegada do grupo, o alcançável
    // cai de 318 para 229 casas, e a área 7 — os dois tanques, o dique, a
    // enchente, três goblins e o aviso ao Klarg — sai do jogo. Ponte destruível
    // só com um segundo caminho para os tanques, que esta planta não tem.
    if (sup === 'ponte' && !estado.ponteCortada) {
      const emCima = hostis(grupos.ponte).find((f) => naLista(PE.ponte, f.pos));
      ops.push({
        rotulo: 'Cortar as cordas da ponte', icone: 'acao-usarObjeto',
        detalhe: emCima ? `Atletismo, CD 10 · ${emCima.name} cai 6 m` : 'Atletismo, CD 10 · não tem ninguém em cima',
        motivo: longe(5),
        fazer: async () => {
          const t = teste(c, 'atletismo', 10);
          if (!t.passou) {
            await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [
              `A corda é de fibra trançada, grossa como um pulso, e ${c.name} não consegue passar o fio nela sem subir na ponte.`] }] });
            return;
          }
          estado.ponteCortada = true;
          enc.field.alternarSobreposicao?.('ponteCaida', true);
          const linhas = [`${c.name} serra o cabo de apoio até ele arrebentar. A ponte tomba para um lado e fica pendurada por um cabo só.`];
          if (emCima) {
            const dano = danoDeQueda(emCima, enc.rng.die(6) + enc.rng.die(6));
            enc.applyDamage(emCima, dano, 'concussão');
            if (!emCima.dead) {
              addCondition(emCima, 'caido');
              const agua = casaPerto(PE.sobAPonte);
              emCima.pos = { ...emCima.pos, x: agua.x, y: agua.y };
            }
            trazer(grupos.ponte);
            linhas.push(emCima.dead
              ? `${emCima.name} despenca de costas no canal, seis metros abaixo, e não se levanta (${dano} de dano).`
              : `${emCima.name} despenca no canal com as pranchas, seis metros abaixo: ${dano} de dano, e fica caído na água rasa.`);
            enc.say('dano', `${emCima.name} cai da ponte: ${dano} de dano.`);
          }
          await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: linhas }] });
          app.refresh();
          if (emCima && !emCima.dead) await combate(grupos.ponte, 'nossa');
        },
      });
    }
    // Área 7: romper o dique de propósito, para gastar a enchente antes que o
    // goblin da ponte a solte em cima do grupo.
    if (sup === 'entulho' && naLista(PE.dique, tile)) {
      const semAgua = estado.enchentes >= 2 || estado.diqueRompido;
      ops.push({
        rotulo: 'Romper o dique', icone: 'acao-usarObjeto',
        detalhe: semAgua ? 'os tanques já desceram' : 'Atletismo, CD 15 · solta a água antes que eles soltem',
        motivo: longe(5) ?? (semAgua ? 'não sobrou água represada' : null),
        fazer: async () => {
          const t = teste(c, 'atletismo', 15);
          if (!t.passou) {
            await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [
              `${c.name} empurra, chuta e puxa as pedras do dique. Elas rangem e ficam onde estão.`] }] });
            return;
          }
          estado.diqueRompido = true;
          await narrar(root, { formato: 'painel', paginas: [{ teste: t, texto: [
            `${c.name} desencaixa a pedra de baixo e sai da frente. O dique desmonta sozinho, e o tanque despeja no canal.`,
            'A armadilha deles acabou de ser gasta do lado errado.',
          ] }] });
          estado.enchente = { turnos: 0 };
          await enchente();
        },
      });
    }
    // Lá fora: vasculhar o mato atrás dos vigias.
    const g2 = grupos.vigias;
    if ((sup === 'arbusto' || sup === 'espinheiro' || sup === 'tocaia') && pendentes().includes(g2)) {
      ops.push({
        rotulo: 'Vasculhar o mato', icone: 'acao-procurar', detalhe: 'Percepção contra a Furtividade deles',
        motivo: longe(30),
        fazer: async () => {
          const r = rolarPericia(enc.rng, c, 'percepcao');
          const achou = r.total >= Math.min(...g2.furtividade);
          await asArmas([achou
            ? `${c.name} vê, entre o mato, ripas de madeira amarradas — e atrás delas dois goblins de arco.`
            : `${c.name} remexe o mato e não vê nada. Mas alguma coisa ali viu ${c.name}.`]);
          await combate(g2, achou ? null : 'deles');
        },
      });
    }
    return ops;
  }

  // ------------------------------------------------------------ investigar ----
  /**
   * AS PISTAS DO ESCONDERIJO para o "Investigar" (`game/investigar.js`), cada uma presa à casa onde o desenho da FA
   * mostra a coisa — os ossos e o espeto do canil, a laje rachada, as caixas com o leão azul (ver o de-para,
   * `revisoes/esconderijo-de-para-2026-11-04.md`). Fatos do livro, palavras nossas. Onde não há pista, vale o achado
   * da superfície; algumas MUDAM A CENA (a laje vista não desaba mais) ou mudam com ela (o fogo apagado, o dique
   * rompido).
   */
  function pistaEm(tile, sup) {
    const sala = salaDe(enc.field, tile);
    const em = (lista) => naLista(lista, tile);
    const no = (p) => tile.x === p.x && tile.y === p.y;
    const luzDe = (p) => (enc.field.luzes ?? []).find((l) => l.pos.x === p.x && l.pos.y === p.y);
    // Área 1: a trilha chega à boca. É a mesma leitura do livro na trilha: perto de uma dúzia de goblins, e dois corpos.
    if (sala === 'fora' && sup === 'grama') {
      return {
        titulo: 'A trilha', pericias: ['sobrevivencia', 'percepcao'], cd: 10,
        achado: 'Pegadas pequenas, muitas, indo e voltando da boca da caverna: perto de uma dúzia de goblins usa este caminho. E, no meio delas, o rastro de dois corpos do tamanho de gente arrastados para dentro.',
      };
    }
    // Área 4: a laje do ressalto. Saber dela não a faz deixar de ceder (o Obelisco pede Acrobacia de quem anda ou briga
    // em cima), mas avisa: é ali que não se quer lutar.
    if (em(RESSALTO) && laje() && !laje().desligada) {
      return {
        titulo: 'A subida do oeste', cd: 10, alcance: 10,
        achado: 'A laje no meio da subida está solta da rocha por baixo, presa só pelo peso do entulho em cima. Quem passar por ela, ou brigar em cima dela, precisa de pé firme — senão a encosta inteira desce para leste.',
      };
    }
    if (sala === 'passagem' && sup === 'riacho') {
      return {
        titulo: 'O riacho', cd: 10,
        achado: 'A água desce de mais acima, fria. No barro da margem, pegadas pequenas de garra — e o mesmo rastro de dois corpos pesados arrastados, subindo a passagem.',
      };
    }
    if (sala === 'passagem' && tile.y <= 8 && sup === 'caverna') {
      return {
        titulo: 'O teto ao norte', pericias: ['percepcao', 'investigacao'], cd: 10, alcance: 30,
        achado: 'Lá em cima, seis metros acima do riacho, uma ponte frágil de madeira e corda cruza de um túnel alto a outro. Quem está nela vê esta passagem inteira.',
      };
    }
    // Área 3: o canil visto dos degraus — o espeto das correntes ao pé da estalagmite desenhada, os ossos, a fenda.
    //
    // UMA pista, feita de LONGE, e não uma no espeto. Medido: a FA cerca a estalagmite de parede, e toda casa
    // encostada nela está dentro do alcance da corrente — investigar o espeto de perto era entrar na briga. Dos
    // degraus (x 13) se enxerga o chão da câmara, e é dali que se descobre que dá para passar.
    if (sala === 'canil' && (sup === 'caverna' || sup === 'estalagmite' || no(PE.corrente))) {
      return {
        titulo: 'O canil', pericias: ['percepcao', 'investigacao'], cd: 10, alcance: 30,
        achado: [
          'Os lobos estão presos por correntes curtas a um espeto de ferro, cravado ao pé da estalagmite do meio da câmara. As correntes não chegam aos degraus da entrada — chegam quase.',
          'No chão, ossos roídos e sujeira de bicho. No fundo, lixo caído de uma fenda alta na parede leste.',
        ],
      };
    }
    if (no(PE.chamineBase) || (sala === 'canil' && sup === 'entulho')) {
      const fogoDeKlarg = luzDe(PE.fogueiraKlarg);
      return {
        titulo: 'O lixo da fenda', cd: 10,
        achado: [
          'Lixo jogado lá de cima: ossos de cozinha, cascas, um sapato furado. A fenda no fundo sobe nove metros, apertada, até outra caverna.',
          fogoDeKlarg && !fogoDeKlarg.apagada ? 'Lá do alto desce ar morno e cheiro de fumaça: tem fogo aceso do outro lado.' : 'Lá do alto desce cheiro de cinza fria.',
        ],
      };
    }
    // Área 6: a fogueira de cozinha, os colchões, e a borda de 3 m com a escada natural.
    if (no(PE.fogueiraCovil)) {
      const fogo = luzDe(PE.fogueiraCovil);
      return {
        titulo: 'A fogueira do covil', cd: 10,
        achado: fogo?.apagada
          ? 'A brasa abafada ainda solta fumaça. A panela pendurada esfria, com um ensopado que já foi coelho.'
          : 'Uma panela de ferro pendurada sobre a brasa, com um ensopado que já foi coelho e um pouco de outra coisa. Os goblins comem aqui.',
      };
    }
    if (sala === 'covil' && sup === 'leito') {
      return {
        titulo: 'Os colchões', cd: 10,
        achado: 'Colchões de palha cheios de pulga, quase uma dúzia, ainda amassados. Dorme mais goblin aqui do que está acordado agora.',
      };
    }
    // O BARRIL DO COVIL era o único objeto PINTADO do esconderijo sem verbo nenhum. A casa (2,6) barra passo e
    // ficou sem sala na pintura (`sala` nela é indefinida), então as pistas de `covil` não a alcançavam e o barril
    // era desenho morto: nem faísca passiva, nem Procurar, nem Investigar. Aqui a pista vem pelo GLIFO, não pela
    // sala, e a varredura de ±2 casas de `casasNotadas` a acende das casas em volta. Ele não dá tesouro: o barril
    // é da pintura da FA, não do livro, e no livro o covil não tem nada além da algibeira do Yeemik — o cheiro de
    // couro curtido que o livro põe na sala é o que está dentro dele.
    if (sup === 'barris') {
      return {
        titulo: 'O barril', cd: 10, alcance: 10,
        achado: 'Um barril de água da chuva, com uma caneca de estanho amassada pendurada na borda e, no fundo, tiras de couro de molho — é daí que vem o cheiro de curtume da caverna. Nada que se carregue.',
      };
    }
    if (sala === 'covil' && tile.y === PE.escadaDoCovil.y - 1 && enc.field.heightAt(tile.x, tile.y) <= 2) {
      return {
        titulo: 'A borda do covil', pericias: ['percepcao', 'investigacao'], cd: 10, alcance: 15,
        achado: 'A parte do fundo fica três metros acima, numa borda de pedra lisa. A escada natural sobe pelo lado leste dela — é o único jeito de chegar lá em cima.',
      };
    }
    // Área 7: o dique de pedra solta e a cachoeira.
    if (em(PE.dique)) {
      return {
        titulo: 'O dique', cd: 10,
        achado: estado.diqueRompido || estado.enchentes >= 2
          ? 'Pedras espalhadas no canal: o dique já cedeu, e o tanque esvaziou.'
          : 'As pedras do dique só estão encaixadas, sem argamassa. Tirando a de baixo, o resto vem junto — e a água desce o canal inteiro até a boca da caverna.',
      };
    }
    if (sala === 'pocos' && sup === 'poco' && tile.x >= 27) {
      return {
        titulo: 'A cachoeira', pericias: ['percepcao', 'investigacao'], cd: 10, alcance: 30,
        achado: 'Uma cachoeira estreita cai de uma fenda alta e enche os tanques. O barulho engole tudo: uma luta aqui não se ouve na caverna do lado.',
      };
    }
    // Área 8: os suprimentos roubados, a fogueira grande e a boca da chaminé.
    if (sala === 'chefe' && (sup === 'mantimentos' || sup === 'bau')) {
      return {
        titulo: 'Os suprimentos', cd: 10,
        achado: [
          'Sacos e caixas com a marca de um leão azul pintada: é da Leão-Escudo, uma companhia mercante de Phandalin. Isto saiu das caravanas assaltadas.',
          ...(estado.bauAchado ? [] : ['E, no meio das pilhas, o canto de um baú aparece.']),
        ],
      };
    }
    if (no(PE.fogueiraKlarg)) {
      const fogo = luzDe(PE.fogueiraKlarg);
      return {
        titulo: 'A fogueira de Klarg', cd: 10,
        achado: fogo?.apagada
          ? 'A brasa abafada solta fumaça grossa. Sem o fogo, a caverna é breu para quem não enxerga no escuro.'
          : 'Brasa larga como uma mesa, e ossos jogados na cinza. Queima quem pisa nela, e mais quem cai em cima.',
      };
    }
    if (no(PE.chamineTopo)) {
      return {
        titulo: 'A boca da chaminé', cd: 10,
        achado: hostis(grupos.canil).length
          ? 'Uma abertura estreita no chão, junto da parede oeste, desce no escuro. Lá de baixo sobe cheiro de bicho e um rosnado.'
          : 'Uma abertura estreita no chão, junto da parede oeste, desce no escuro até o canil.',
      };
    }
    return null;
  }

  // O que a cena aceita das magias de utilidade (`game/magias-fora.js`): o baú de Klarg tem duas
  // poções de cura, e o Detectar Magia as acende no chão.
  function ganchosMagicos() {
    if (!estado.explorando) return [];
    const f = enc.field;
    const out = [];
    // Lote 14: as feras do canil (Amizade Animal), e o baú (Localizar Objeto).
    const canil = grupos.canil;
    if (canil && !canil.vencido && !canil.tregua && hostis(canil).length) {
      out.push({
        id: 'canil', tipo: 'fera', x: PE.corrente.x, y: PE.corrente.y, nome: 'Os lobos acorrentados',
        criaturas: () => hostis(canil),
        // Quando nenhum lobo ainda rosna, o canil está em trégua: eles aparecem deitados, nas correntes.
        aplicar: () => {
          if (hostis(canil).length) return;
          canil.tregua = true;
          trazer(canil);
          enc.say('acao', 'Os três lobos se deitam nas correntes, de olho no grupo, sem rosnar. Dá para passar.');
        },
      });
    }
    // A laje frágil é fraqueza natural da pedra, não armadilha: Encontrar Armadilhas não a vê.
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        if (!estado.bauAchado && DENTRO_DO_KLARG(f, { x, y }) && f.surfaceAt(x, y) === 'bau') {
          out.push({ id: `bau-p:${x},${y}`, tipo: 'procurado', x, y, nome: 'Um baú (o mais próximo)' });
          out.push({
            id: `bau:${x},${y}`, tipo: 'magico', x, y, nome: 'O baú entre os suprimentos',
            aura: { escola: 'evocação', texto: 'Duas auras pequenas e iguais lá dentro, de frasquinhos que curam. Nada mais de mágico no baú.' },
          });
        }
      }
    }
    return out;
  }

  /** O bicho de Sentidos da Fera viu estas criaturas escondidas: elas já não pegam ninguém de surpresa. */
  function espiou(criaturas) {
    for (const g of Object.values(grupos)) {
      if (g.membros.some((m) => criaturas.includes(m))) g.furtividade = g.furtividade.map(() => 0);
    }
  }

  /** Falar com Plantas: o mato conta quem se esconde nele (os vigias do posto de ripas). */
  async function plantasSabem(c) {
    const g = grupos.vigias;
    const perto = pendentes().includes(g) && hostis(g).some((f) => distanceFt(f.pos, c.pos) <= 30);
    if (!perto) {
      await narrar(root, { formato: 'painel', paginas: [{ titulo: 'Falar com Plantas', texto: [
        'O mato fala de gente: só o grupo, a trilha, e um cheiro velho de goblin que veio do riacho e voltou. Nada escondido aqui por perto.'] }] });
      return;
    }
    const escolha = await narrar(root, {
      formato: 'painel',
      paginas: [{ texto: ['O mato farfalha em coro: "dois, dois de arco, atrás das ripas onde o galho vergou… um cochila, o outro olha o riacho".',
        `${c.name} já sabe onde estão, e eles não sabem que foram descobertos.`] }],
      escolhas: [{ rotulo: 'Às armas!', valor: 'luta', primaria: true }, { rotulo: 'Ainda não', valor: 'ainda' }],
    });
    if (escolha === 'ainda') { espiou(hostis(g)); return; }
    await combate(g, 'nossa');
  }

  /** Sala resolvida: caiu, fez trégua ou não sobrou ninguém de pé nela. */
  const salaLimpa = (g) => g.vencido || g.tregua || !hostis(g).length;

  function motivoSemDescanso(tipo) {
    if (!estado.explorando) return 'só fora da luta';
    if (tipo === 'longo' && !grupos.chefe.vencido) {
      // Com o covil e os poços resolvidos, o esconderijo inteiro fica atrás do
      // grupo: só a caverna do chefe continua de pé, e ela tem uma porta de uma
      // casa para vigiar. Antes, Klarg vivo proibia o descanso longo em
      // qualquer caso, e a luta dele derrubava 32% das cadeias por DESGASTE —
      // o grupo chegava com 52 dos 68 PV e sem espaço de magia nenhum.
      if (!salaLimpa(grupos.covil) || !salaLimpa(grupos.pocos)) {
        return 'com os goblins acordados aí dentro, ninguém dorme oito horas';
      }
    }
    return null;
  }

  /**
   * Todas as pistas de uma casa, uma por verbo (`game/investigar.js`): a da cena (`pistaEm`) e as de LEMBRAR, que
   * são o que o herói sabe do que vê — não o que a casa esconde.
   */
  function pistasEm(tile, sup, c) {
    const out = [];
    const p = pistaEm(tile, sup, c);
    if (p) out.push(p);
    if (salaDe(enc.field, tile) === 'chefe' && (sup === 'mantimentos' || sup === 'bau')) {
      out.push({
        verbo: 'lembrar', titulo: 'O leão azul', pericias: ['historia'], cd: 10,
        achado: 'O leão azul é a marca da Leão-Escudo, uma companhia mercante que tem posto em Phandalin. Carga roubada dela, devolvida, abre portas por lá.',
      });
    }
    return out;
  }


  return {
    lugar: 'Esconderijo Dentefino',
    get explorando() { return estado.explorando; },
    get encerrado() { return estado.encerrado; },
    // Investigar o cenário e os corpos, e apagar e acender as fogueiras (`game/investigar.js`, `game/fogo.js`).
    investigavel: true,
    pistaEm,
    pistasEm,
    naRegiao,
    interacoes,
    ganchosMagicos,
    plantasSabem,
    espiou,
    depoisDeMover,
    fimDoCombate,
    evento,
    dialogoDe,
    depoisDaConversa,
    motivoSemDescanso,
    textoDoDescanso: (tipo) => (tipo === 'curto'
      ? ['Uma hora encostados na rocha, longe da passagem, revezando quem fica de olho.']
      : [grupos.chefe.vencido
        ? 'Oito horas no fundo da caverna, com a fogueira de Klarg ainda em brasa e um de vocês sempre acordado.'
        : 'Oito horas no covil tomado, com a porta do fundo à vista e dois de vocês acordados por vez. Lá atrás, no escuro, alguma coisa grande anda de um lado para o outro a noite inteira.']),
    // Descansar lá fora faz barulho: os vigias atacam.
    depoisDoDescanso: () => barulhoLaFora(),
    async iniciar() {
      if (!config.pularAbertura) await abertura();
      prepararExploracao();
      await chegada();
      // O marco do livro: 75 XP para cada um ao achar o esconderijo (uma vez
      // por herói, mesmo tentando de novo).
      const grupo = herois().filter((c) => !c.marcos?.includes('esconderijo'));
      for (const c of grupo) (c.marcos ??= []).push('esconderijo');
      if (grupo.length) {
        darXp(grupo, 75);
        enc.say('cura', `Cada herói ganha 75 XP por achar o esconderijo (${grupo[0].xp} de ${proximoNivelEm(grupo[0]) ?? '—'} para o próximo nível).`);
      }
    },
  };
}
