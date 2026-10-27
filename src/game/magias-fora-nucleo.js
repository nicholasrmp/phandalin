// NÚCLEO (sem tela) das magias de utilidade FORA do combate, lote 14 (Salto, Alarme, Detectar o Bem e o
// Mal, Encontrar Armadilhas, Zona da Verdade, Localizar Objeto, Línguas, Alterar
// Aparência, Cativar, Amizade Animal, Sentidos da Fera, Fingir de Morto, Falar com
// Plantas, Convocar Familiar): a camada do jogo que `magias-fora.js` chama.
//
// A regra mora em `rules/utilidade.js`. Aqui ficam: quem a magia alcança na cena,
// o texto do que aconteceu, as marcas no mapa e as ações novas (espiar com o
// bicho, perguntar às plantas, acordar quem finge de morto).
//
// Este arquivo NÃO importa `magias-fora.js` (ele é quem o importa) nem toca na tela, para dar para
// testar em Node: as funções que precisam do contexto (`x`: estado do grupo, heróis, dado) recebem-no
// de fora. As ações com painel (espiar, perguntar às plantas) moram em `magias-fora-extra.js`.
//
// GANCHOS NOVOS da cena (`capitulo.ganchosMagicos(c)`), além dos de `magias-fora.js`:
//   'armadilha'  { id, tipo, x, y, nome, texto, vista?, revelar() }  uma armadilha da cena;
//                `revelar()` a desarma no jogo (marca o fosso, tira o fio) e devolve true se era nova
//   'procurado'  { id, tipo, x, y, nome }  um objeto que Localizar Objeto acha (a chave, o baú…)
//   'fera'       { id, tipo, x, y, nome, criaturas(), aplicar?(m) }  feras que a Amizade Animal pega
// e dois ganchos opcionais do capítulo (`app.capitulo`):
//   plantasSabem(c)  o que as plantas contam (Falar com Plantas); o capítulo narra e age
//   espiou(criaturas)  o bicho viu estas criaturas escondidas (o capítulo tira a surpresa delas)

import { distanceFt, squaresOf } from '../core/grid.js';
import { podeVer } from '../rules/luz.js';
import { hasCondition, removeCondition } from '../rules/conditions.js';
import {
  ativaDe, ativasDoGrupo, encerrar, chaveDoNpc, sentidasPorBemMal, eFeraAmansavel, ladoBemMal,
  ladoAparente, tipoAparente, FAMILIARES,
  ALCANCE_BEM_MAL,
  destinoDoNpc,
} from '../rules/utilidade.js';
import { familiarDe, familiarVirtual } from '../rules/familiar.js';
import { getSpell } from '../rules/spells.js';

/** Pés para metros, em português ("9 m", "7,5 m"). */
export const metros = (ft) => {
  const m = Math.round(ft * 0.3 * 2) / 2;
  return `${String(m).replace('.', ',')} m`;
};

// -------------------------------------------------------------- criaturas ----

/** Todas as criaturas da cena: as do tabuleiro e as que ainda esperam fora dele. */
export function criaturasDaCena(app) {
  const set = new Set(app.enc?.combatants ?? []);
  for (const m of app.inimigosEscondidos ?? []) set.add(m);
  return [...set];
}

/** `c` vê `m`? No tabuleiro vale a luz; fora dele, só a linha de visão. */
export function visivelPara(app, c, m) {
  const enc = app.enc;
  if (!m.pos || !c.pos) return false;
  if (enc.combatants.includes(m)) return podeVer(enc, c, m);
  return enc.field.hasLineOfSight(c.pos, m.pos);
}

/** As feras que a Amizade Animal alcança agora (do tabuleiro, de gancho 'fera' e as ocultas). */
export function ferasAoAlcance(app, c, alcanceFt) {
  const ganchos = (app.capitulo?.ganchosMagicos?.(c) ?? []).filter((g) => g.tipo === 'fera');
  const lista = new Set([...ganchos.flatMap((g) => g.criaturas()), ...criaturasDaCena(app)]);
  return [...lista]
    .filter((m) => eFeraAmansavel(m) && m.side !== 'neutro' && m.pos && distanceFt(c.pos, m.pos) <= alcanceFt && visivelPara(app, c, m))
    .sort((a, b) => distanceFt(c.pos, a.pos) - distanceFt(c.pos, b.pos));
}

/** Os bichos que Sentidos da Fera pode tocar: o familiar (no tabuleiro ou de papel) e feras do grupo ou neutras ao lado. */
export function bichosDisponiveis(app, c, estado) {
  const out = [];
  const noTabuleiro = (app.enc?.combatants ?? []).find((m) => m.familiar && !m.dead);
  const f = noTabuleiro ?? familiarVirtual(estado, c);
  if (f) out.push(f);
  for (const m of app.enc?.combatants ?? []) {
    if (m !== f && !m.dead && m.hp > 0 && m.tipo === 'fera' && m.side !== 'foes' && m.pos && distanceFt(c.pos, m.pos) <= 5) out.push(m);
  }
  return out;
}

// ------------------------------------------------------- antes e depois ----

/** Completa as opções de `conjurarFora` com o que só a cena sabe. Devolve { opts } ou { erro }. */
export function preparar(x, c, spellId, opts) {
  const { app } = x;
  const spell = getSpell(spellId);
  if (spellId === 'cativar') {
    const ja = opts.criaturas ?? criaturasDaCena(app).filter((m) => m.side !== 'party' && !m.dead && m.hp > 0 && m.pos
      && distanceFt(c.pos, m.pos) <= spell.rangeFt && visivelPara(app, c, m));
    const com = opts.npc && !ja.includes(opts.npc) && !opts.npc.dead && opts.npc.side !== 'party' ? [...ja, opts.npc] : ja;
    if (!com.length) return { erro: 'ninguém à vista que possa ouvir' };
    const perto = com.filter((m) => !m.pos || !c.pos || distanceFt(c.pos, m.pos) <= spell.rangeFt);
    if (!perto.length) return { erro: `longe demais — Cativar alcança ${spell.rangeFt} pés` };
    return { opts: { ...opts, criaturas: perto } };
  }
  if (spellId === 'fundirSeComPedra') {
    // Precisa de pedra do lado: parede, rocha, alvenaria ou laje de pedra.
    const PEDRAS = new Set(['parede', 'rocha', 'alvenaria', 'portaAberta', 'passagemAberta', 'laje', 'seteira', 'sarcofago', 'estalagmite']);
    const f = app.enc?.field;
    const perto = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => PEDRAS.has(f?.surfaceAt(c.pos.x + dx, c.pos.y + dy)));
    if (!perto) return { erro: 'não há pedra ao lado em que se fundir' };
  }
  if (spellId === 'alarme' || spellId === 'bocaMagica') {
    return { opts: { ...opts, dados: { ponto: { x: c.pos.x, y: c.pos.y }, cena: app.capitulo?.lugar } } };
  }
  if (spellId === 'comunhao') {
    // As respostas são computadas aqui, onde a cena existe: a regra não
    // enxerga o mapa nem os ganchos do capítulo.
    const todas = perguntasDaComunhao(app, x.estado, x.herois());
    const escolhidas = (opts.opcao ?? []).slice(0, 3);
    const respostas = todas.filter((q) => escolhidas.includes(q.id)).map((q) => ({ pergunta: q.pergunta, sim: q.sim }));
    return { opts: { ...opts, dados: { respostas } } };
  }
  if (spellId === 'clarividencia') {
    const sentido = opts.opcao ?? 'ver';
    const ponto = { x: c.pos.x, y: c.pos.y };
    // O OUVIR não marca o mapa: ele dá um NÚMERO, contado na hora em que o
    // olho abre. O `desc` declara que a conta é desse instante.
    const achados = oQueOOlhoAcha(app, ponto, sentido);
    const ouviu = sentido === 'ouvir' ? achados.length : null;
    // Quem o olho pegou perde a emboscada, como no Sentidos da Fera: a magia
    // gasta a surpresa deles, em vez de anulá-la sem custo nenhum.
    if (achados.length) app.capitulo?.espiou?.(sentido === 'ouvir' ? achados : achados.slice(0, 3));
    return { opts: { ...opts, dados: { ponto, cena: app.capitulo?.lugar, sentido, ouviu } } };
  }
  if (spellId === 'localizarObjeto') {
    const g = opts.gancho;
    if (!g) return { erro: 'escolha o que procurar' };
    return { opts: { ...opts, dados: { ponto: { x: g.x, y: g.y }, nome: g.nome, gid: g.id } } };
  }
  if (spellId === 'amizadeAnimal') {
    const ja = opts.criaturas ?? (opts.alvo ? [opts.alvo] : ferasAoAlcance(app, c, spell.rangeFt));
    return { opts: { ...opts, criaturas: ja } };
  }
  return { opts };
}

/** Depois de a regra rodar: o que só a cena resolve (revelar armadilhas, sentir criaturas, avisar o capítulo). */
export function posConjurar(x, c, spellId, r, opts) {
  const { app, estado } = x;
  const res = r.resultado;
  if (spellId === 'encontrarArmadilhas') res.armadilhas = revelarArmadilhas(app, estado, c);
  if (spellId === 'detectarBemMal') res.sentidas = sentidasPorBemMal(estado, x.herois(), c, criaturasDaCena(app));
  if (spellId === 'amizadeAnimal') {
    for (const f of res.feras ?? []) if (!f.resistiu) opts.gancho?.aplicar?.(f.m);
    if ((res.feras ?? []).some((f) => !f.resistiu)) app.refresh?.();
  }
}

/** Revela as armadilhas da cena que `c` vê a até 36 m. Devolve [{ nome, texto, novo }]. */
export function revelarArmadilhas(app, estado, c) {
  const gs = (app.capitulo?.ganchosMagicos?.(c) ?? []).filter((g) => g.tipo === 'armadilha'
    && distanceFt(c.pos, g) <= 120 && app.enc.field.hasLineOfSight(c.pos, { x: g.x, y: g.y }));
  const out = [];
  for (const g of gs) {
    const novo = g.vista ? false : g.revelar?.() ?? true;
    (estado.marcas ??= []);
    if (!g.semMarca && !estado.marcas.some((m) => m.id === g.id)) {
      estado.marcas.push({ id: g.id, tipo: 'armadilha', x: g.x, y: g.y, nome: g.nome, lugar: app.capitulo?.lugar ?? null });
    }
    out.push({ nome: g.nome, texto: g.texto, novo });
  }
  if (out.some((o) => o.novo)) app.refresh?.();
  return out;
}

// ------------------------------------------------------------------ texto ----

/** A direção de `a` para `b` em 8 pontos da bússola, como o mapa aparece na tela (o norte é para cima). */
export function direcaoDe(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (!dx && !dy) return 'bem aqui';
  const ang = Math.atan2((dx + dy) * 16, (dx - dy) * 32) * 180 / Math.PI; // projeção isométrica: 0 = direita da tela, 90 = baixo
  const nomes = ['a leste', 'ao sudeste', 'ao sul', 'ao sudoeste', 'a oeste', 'ao noroeste', 'ao norte', 'ao nordeste'];
  return nomes[(Math.round(ang / 45) + 8) % 8];
}

const LADO = { bem: 'o bem', mal: 'o mal', neutro: 'nem o bem nem o mal' };

/** O texto de uma das magias do lote 14; devolve null para as outras. */
export function contarNovas(x, c, r, { alvo = null } = {}) {
  const id = r.spell.id;
  const res = r.resultado;
  const nome = alvo?.name ?? 'o alvo';
  switch (id) {
    case 'salto':
      return [`${nome} sente as pernas leves, como se o chão empurrasse de volta. Por 1 minuto, cada salto vai três vezes mais longe, e dá para pousar um degrau acima.`];
    case 'alarme':
      return [`${c.name} risca uma marca discreta no chão e murmura baixo. Por 8 horas, quem se aproximar sem ser anunciado faz um sino mudo tocar na cabeça do grupo. Numa emboscada por aqui, ninguém será pego de surpresa.`];
    case 'detectarBemMal': {
      const s = res.sentidas ?? [];
      const t = [`${c.name} abre uma segunda visão: por 10 minutos, enquanto se concentrar, sente o bem e o mal a até 9 m, mesmo atrás da parede.`];
      if (!s.length) t.push('Por enquanto, nada: só o frio comum da pedra.');
      else {
        // O tipo APARENTE: a Aura Mágica engana a adivinhação, e é isso que
        // o conjurador vê e ouve (`rules/utilidade.js`).
        for (const m of s) t.push(`Um ${tipoAparente(m)} (${LADO[ladoAparente(m)]}), a ${metros(distanceFt(c.pos, m.pos))}, ${direcaoDe(c.pos, m.pos)}.`);
        t.push('Elas aparecem no mapa, numa coluna de luz.');
      }
      return t;
    }
    case 'encontrarArmadilhas': {
      const a = res.armadilhas ?? [];
      if (!a.length) return [`${c.name} estende os sentidos e não acha nada: nenhuma armadilha ao alcance da vista.`];
      return [`${c.name} estende os sentidos e sente o perigo de propósito escondido:`, ...a.map((k) => `${k.nome}: ${k.texto}${k.novo ? '' : ' (já era sabida)'}`), 'As armadilhas ficam marcadas no mapa.'];
    }
    case 'zonaDaVerdade':
      return [res.resistiu
        ? `${nome} resiste (CAR ${res.resistencia.total} contra CD ${res.dc}): a zona não pega nele, e ele sabe que tentaram.`
        : `${nome} falha (CAR ${res.resistencia.total} contra CD ${res.dc}): por 10 minutos não consegue dizer uma mentira. Pode calar, ou responder de lado — mas o que disser será verdade.`];
    case 'localizarObjeto': {
      const d = r.ativa?.data;
      return [`${c.name} fecha os olhos e vai se virando devagar até sentir um puxão: ${d?.nome ?? 'o objeto'} está ${direcaoDe(c.pos, d.ponto)}, ${distanceFt(c.pos, d.ponto) <= 30 ? 'bem perto' : distanceFt(c.pos, d.ponto) <= 120 ? 'a uma boa caminhada' : 'longe'}. A marca no mapa dura enquanto durar a concentração.`];
    }
    case 'linguas':
      return [`As palavras de qualquer boca deixam de ser ruído para ${c.name}, e a língua dele solta qualquer idioma que o outro entenda. Por 1 hora, entende e fala goblin, bugbear, o que for.`];
    case 'alterarAparencia':
      return [`O corpo de ${c.name} escorre como cera e se refaz: outro rosto, outra altura, outra voz. Por 1 hora passa por um dos de capa vermelha, e nenhum exame desfaz a mudança. Vantagem em Enganação (regra da casa). (Concentração.)`];
    case 'cativar': {
      const t = res.cativos ?? [];
      const presos = t.filter((k) => !k.resistiu);
      return [
        `${c.name} começa a contar uma história que não dá para não ouvir. ${presos.length ? `${presos.map((k) => k.m.name).join(', ')} ${presos.length > 1 ? 'ficam cativados' : 'fica cativado'}: só têm olhos para ${c.name}.` : 'Ninguém se deixa prender.'}`,
        ...t.filter((k) => k.resistiu).map((k) => (k.imune ? `${k.m.name} é imune a encanto: a conversa não o prende.` : `${k.m.name} resiste (SAB ${k.total} contra CD ${res.dc}).`)),
        presos.length ? 'Por 1 minuto, enquanto durar a conversa, eles não gritam nem dão o alarme, e notam muito pouco do que mais acontece.' : '',
      ].filter(Boolean);
    }
    case 'amizadeAnimal': {
      const f = res.feras ?? [];
      return [
        `${c.name} se agacha, estende a mão aberta e fala baixo.`,
        ...f.map((k) => (k.imune ? `${k.m.name} é imune a encanto: nada muda.` : k.longe ? `${k.m.name} está longe demais.` : k.resistiu ? `${k.m.name} rosna e resiste (SAB ${k.total} contra CD ${res.dc}).` : `${k.m.name} deixa de rosnar e se deita, olhando ${c.name} sem raiva (SAB ${k.total} contra CD ${res.dc}). Por 24 horas, não ataca, a não ser que alguém o machuque.`)),
      ];
    }
    case 'sentidosDaFera':
      return [`${c.name} toca ${nome} e fecha os olhos. Por 1 hora, enquanto se concentrar, pode ver e ouvir pelo bicho: clique numa casa para mandá-lo espiar lá. (Concentração.)`];
    case 'fingirDeMorto':
      return [`${nome} para de respirar, o rosto empalidece e o corpo fica mole: parece morto. Fica cego e imóvel por 1 hora, resiste a qualquer dano menos psíquico, e os inimigos o ignoram. Só quem conjurou o acorda, tocando nele.`];
    case 'falarComPlantas':
      return [`O mato em volta de ${c.name} começa a farfalhar em palavras, e cada folha tem a sua. Por 10 minutos, num raio de 9 m, pode perguntar o que passou por ali: clique no herói e escolha "Perguntar às plantas".`];
    case 'encontrarFamiliar': {
      const f = res.familiar;
      return [`Fumaça de incenso sobe e um círculo de giz se fecha. De dentro dele sai ${f?.opcao === 'morcego' ? 'um morcego' : 'um rato'} de olhos azuis demais para um bicho. É o familiar de ${c.name}: obedece, não ataca, e entra na luta junto do grupo. Não está no tabuleiro fora da luta, mas é olho e ouvido de ${c.name}.`];
    }
    default:
      return null;
  }
}

// ------------------------------------------------------------------ marcas ----

/**
 * As marcas do mapa que as magias deixam: colunas de luz translúcidas (volume, não tinta no chão)
 * sobre quem o Detectar o Bem e o Mal sente, as armadilhas reveladas, o objeto de Localizar Objeto
 * e as criaturas que o bicho viu. `cor` é uma chave de `fx.js` (DOMO_CORES).
 */
/**
 * O QUE O OLHO DA CLARIVIDÊNCIA ACHA, da mais perto para a mais longe.
 *
 * VER alcança 9 m e uma parede; OUVIR, 18 m e duas — som dobra esquina.
 *
 * O que ele NÃO acha: quem está invisível (o olho vê, não adivinha), quem é
 * neutro — os prisioneiros dos Marcarrubra, o Droop, o rato do mago — e quem
 * está a 0 PV sem estar marcado como morto.
 *
 * O que ele ACHA, e de propósito: quem ainda não entrou no tabuleiro. Essa é a
 * razão de ser de uma magia de batedor, e tirá-la zerava a magia — medido, com
 * esse filtro o olho não achava ninguém na mansão inteira, porque toda criatura
 * de uma sala que o grupo não alcançou espera fora do tabuleiro. Quem o olho vê
 * perde a emboscada em troca, pelo `capitulo.espiou`, que é o que o Sentidos da
 * Fera já faz: a magia gasta a surpresa deles em vez de desfazê-la de graça.
 */
/**
 * AS PERGUNTAS DA COMUNHÃO, e as respostas que o motor sabe de verdade.
 *
 * O livro deixa perguntar qualquer coisa e o mestre responde. Aqui a lista é
 * fechada, e de propósito: uma resposta inventada por uma magia que o livro
 * garante ser CERTA seria pior que não ter a magia. Cada pergunta aqui tem a
 * resposta num estado que o jogo guarda.
 */
export function perguntasDaComunhao(app, estado, herois) {
  // ESPERA: inimigo de verdade que o grupo ainda NÃO viu. O neutro (o
  // prisioneiro dos Marcarrubra, o Droop, o rato do mago) não espera ninguém, e
  // quem já está no tabuleiro não é surpresa — contá-los respondia "sim" onde a
  // resposta honesta é "não".
  const noTabuleiro = new Set(app.enc?.combatants ?? []);
  const esperando = (app.inimigosEscondidos ?? [])
    .filter((m) => !m.dead && m.side === 'foes' && !noTabuleiro.has(m));
  const armadilhas = (app.capitulo?.ganchosMagicos?.(herois[0]) ?? []).filter((g) => g.tipo === 'armadilha' && !g.vista);
  const vivo = (id) => destinoDoNpc(estado, id) !== 'morto';
  return [
    { id: 'espera', pergunta: 'Alguém espera o grupo neste lugar?', sim: esperando.length > 0 },
    { id: 'armadilha', pergunta: 'Há armadilha escondida por aqui?', sim: armadilhas.length > 0 },
    { id: 'gundren', pergunta: 'Gundren Rockseeker ainda vive?', sim: vivo('gundren') },
    { id: 'iarno', pergunta: 'Iarno Albrek ainda vive?', sim: vivo('iarno') },
    // A quinta pergunta vem de estado guardado, como as duas de cima. A que
    // estava aqui antes — "o grupo está onde pensa que está?" — era tautologia
    // dentro de um capítulo e, fora dele, respondia NÃO a uma verdade.
    { id: 'iarnoPreso', pergunta: 'Iarno Albrek está preso?', sim: destinoDoNpc(estado, 'iarno') === 'nossoPrisioneiro' },
  ];
}

export function oQueOOlhoAcha(app, ponto, sentido) {
  const ouve = sentido === 'ouvir';
  const raio = ouve ? 60 : 30;
  const paredes = ouve ? 2 : 1;
  const campo = app.enc?.field;
  return criaturasDaCena(app)
    .filter((m) => {
      if (m.dead || !m.pos || (m.hp ?? 1) <= 0) return false;
      if (m.side === 'party' || m.side === 'neutro') return false;
      if (hasCondition(m, 'invisivel')) return false;
      if (distanceFt(ponto, m.pos) > raio) return false;
      // Pegada de 2x2: vale a casa dela que o olho alcança melhor.
      if (campo && Math.min(...squaresOf(m.pos).map((q) => campo.paredesEntre(ponto, q))) > paredes) return false;
      return true;
    })
    .sort((p, q) => distanceFt(ponto, p.pos) - distanceFt(ponto, q.pos));
}

export function marcas(x) {
  const { app, estado } = x;
  if (!app.capitulo?.explorando || !app.enc) return [];
  const herois = x.herois();
  const out = [];
  const lugar = app.capitulo.lugar ?? null;
  const COR = { bem: 'marca-bem', mal: 'marca-mal', neutro: 'marca-neutro' };
  for (const a of ativasDoGrupo(estado, herois)) {
    if (a.spellId === 'detectarBemMal') {
      const dono = herois.find((h) => h.id === a.por);
      if (!dono) continue;
      for (const m of sentidasPorBemMal(estado, herois, dono, criaturasDaCena(app))) out.push({ x: m.pos.x, y: m.pos.y, cor: COR[ladoAparente(m)], nome: tipoAparente(m), f: m.pos.f ?? 1 });
    }
    if (a.efeito === 'localizar' && a.data?.ponto) out.push({ x: a.data.ponto.x, y: a.data.ponto.y, cor: 'marca-alvo', nome: a.data.nome });
    // CLARIVIDÊNCIA: só o VER marca o mapa, e marca no máximo TRÊS.
    //
    // O OUVIR não entra aqui de propósito. Ele promete "só conta quantos são",
    // e marcar a casa exata de cada criatura é localizar, não contar: medido na
    // mansão, ele acendia 23 das 24 criaturas, cada uma no seu quadrado. O
    // número que ele dá sai no texto da conjuração (`olhoOuviu`, abaixo).
    //
    // E o VER para em três porque o limite de parede não bastava: medido, ele
    // cortava 14% do alcance, e o olho ainda nomeava dez criaturas de uma vez
    // no esconderijo e treze no castelo. Três é "o que o olho alcança olhando
    // para um lado", e está declarado no `desc` como regra da casa.
    if (a.efeito === 'olho' && a.data?.sentido !== 'ouvir' && a.data?.ponto && a.data?.cena === lugar) {
      for (const m of oQueOOlhoAcha(app, a.data.ponto, 'ver').slice(0, 3)) {
        out.push({ x: m.pos.x, y: m.pos.y, cor: 'marca-olho', nome: tipoAparente(m), f: m.pos.f ?? 1 });
      }
    }
    // Alterar Aparência: um halo lilás em volta de quem está transformado.
    if (a.spellId === 'alterarAparencia') {
      const dono = herois.find((h) => h.id === a.por);
      if (dono?.pos) out.push({ x: dono.pos.x, y: dono.pos.y, cor: 'marca-aparencia', nome: dono.name });
    }
    // Alarme: um anel baixo no chão, no ponto vigiado, enquanto a cena for a mesma.
    if (a.spellId === 'alarme' && a.data?.ponto && a.data.cena === lugar && lugar != null) out.push({ x: a.data.ponto.x, y: a.data.ponto.y, cor: 'marca-alarme', nome: 'Alarme' });
    // Zona da Verdade: uma coluna dourada em volta de quem não consegue mentir.
    if (a.efeito === 'zona') {
      const m = criaturasDaCena(app).find((k) => a.npc != null && chaveDoNpc(k) === a.npc && !k.dead && k.pos);
      if (m) out.push({ x: m.pos.x, y: m.pos.y, cor: 'marca-verdade', nome: m.name, f: m.pos.f ?? 1 });
    }
  }
  // Fingir de Morto: a figura apagada, cinza, enquanto durar.
  for (const h of herois) if (h.pos && !h.dead && hasCondition(h, 'fingeMorto')) out.push({ x: h.pos.x, y: h.pos.y, cor: 'marca-fingido', nome: h.name });
  for (const m of estado.marcas ?? []) {
    if (m.tipo === 'armadilha' && m.lugar === lugar) out.push({ x: m.x, y: m.y, cor: 'marca-armadilha', nome: m.nome });
    if (m.tipo === 'espiado' && m.lugar === lugar && m.fim > estado.minutos) out.push({ x: m.x, y: m.y, cor: 'marca-espia', nome: m.nome });
  }
  return out;
}

// --------------------------------------------------------------- ações novas ----

const PLANTAS = new Set(['arbusto', 'espinheiro', 'tocaia', 'arvore', 'grama', 'mato', 'capim']);

/** Quantas casas de planta há a até 9 m de `c`. */
export function plantasPerto(app, c) {
  const f = app.enc.field;
  let n = 0;
  for (let y = Math.max(0, c.pos.y - 6); y <= Math.min(f.h - 1, c.pos.y + 6); y++) {
    for (let xx = Math.max(0, c.pos.x - 6); xx <= Math.min(f.w - 1, c.pos.x + 6); xx++) {
      if (PLANTAS.has(f.surfaceAt(xx, y)) && distanceFt(c.pos, { x: xx, y }) <= 30) n += 1;
    }
  }
  return n;
}

/** Acordar quem finge de morto: quem conjurou o toca. */
export function acordar(x, alvo) {
  if (!hasCondition(alvo, 'fingeMorto')) return false;
  removeCondition(alvo, 'fingeMorto');
  const a = ativaDe(x.estado, x.herois(), 'fingirDeMorto', { alvo });
  if (a) encerrar(x.estado, a, x.herois());
  x.say(`${alvo.name} acorda: o fingimento acaba.`);
  return true;
}
