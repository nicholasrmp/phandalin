// A ATENÇÃO DO HERÓI — o que o botão direito deixa fazer com uma casa, um corpo ou uma criatura, além do "Olhar".
//
// OS VERBOS SÃO AS PERÍCIAS DO LIVRO, e cada um responde uma pergunta diferente:
//
//   Olhar          de graça: o que qualquer um vê dali.
//   Procurar       Percepção — o que está ESCONDIDO: armadilha, passagem, alguém de tocaia. Vale na casa e nas oito em
//                  volta, e a CD nunca aparece no menu (ela já diria que há algo ali).
//   Investigar     Investigação — o que se DEDUZ: como o mecanismo funciona, o que aconteceu aqui.
//   Ler os rastros Sobrevivência — quem passou, quantos, para onde.
//   Lembrar        História, Arcanismo, Religião ou Natureza — o que o herói SABE do lugar, do símbolo, da criatura.
//   Examinar       Medicina — o corpo: de que morreu, de onde veio.
//
// Cada opção mostra a perícia e o bônus de QUEM vai rolar. Um aliado perto do mesmo ponto ajuda (a ação Ajudar do
// SRD): fora da luta isso é de graça e dá vantagem. Uma tentativa por herói em cada ponto e verbo (`game/buscas.js`):
// outro herói pode tentar, o mesmo não — senão a CD some. Na luta custa a ação, menos Lembrar, que é memória.
//
// DE ONDE VEM O QUE SE ACHA, do mais geral para o mais da cena:
//
//   a superfície   `ACHADOS_DA_SUPERFICIE`: o riacho, a rocha, a fogueira... Vale em qualquer mapa, porque vem do
//                  glifo do terreno — que é a camada de regra pintada sobre a arte.
//   o corpo        `ACHADOS_NO_CORPO`, por bloco de criatura.
//   a criatura     o próprio bloco: resistências, imunidades, sentidos e traços, para quem Lembrar.
//   a pista        da cena (`capitulo.pistaEm`/`pistasEm`), presa às casas ONDE A ARTE DESENHA A COISA, ou marcada no
//                  editor (ferramenta 9, com teste). O verbo dela sai das perícias (`verbo` manda, se vier).
//
// Todo achado vai para o DIÁRIO (`enc.diario`) e para o registro, que a sala inteira vê. Os textos são nossos.
import { distanceFt } from '../core/grid.js';
import { skillBonus, passivePerception } from '../rules/abilities.js';
import { hasCondition, CONDITIONS } from '../rules/conditions.js';
import { TRAIT_INFO, MONSTERS } from '../rules/monsters.js';
import { rolarTeste } from '../rules/utilidade.js';
import { ctxDe } from './magias-fora.js';
import { criarBuscas } from './buscas.js';
import { armadilhasDaCena } from './armadilhas.js';

export const PERICIAS_DE_INVESTIGAR = ['investigacao'];
export const CD_PADRAO = 10;

/**
 * O que a atenção acha em cada superfície. `cd` é a do teste; `achado`, o texto de quem passa. Quem falha lê
 * `falha`, ou a frase de sempre. Superfície sem entrada aqui não ganha "Investigar" (só a pista da cena a dá).
 */
export const ACHADOS_DA_SUPERFICIE = {
  riacho: { achado: 'Meio metro de água fria, correndo devagar: anda-se nela sem perder passo. Na lama da margem, pegadas pequenas de pé descalço, com marca de unha.' },
  poco: { achado: 'Água parada e funda; não se vê o fundo. Atravessar aqui é nadar, e nadar custa o dobro.' },
  aguaEscura: { achado: 'Água escura demais para ver o fundo. O que estiver lá embaixo vê quem está em cima antes.' },
  rocha: { achado: 'Pedra úmida e fria, sem fenda que se possa usar. Com o ouvido encostado, dá para tentar escutar o outro lado.' },
  parede: { achado: 'Parede firme, sem junta solta nem marca de passagem.' },
  alvenaria: { achado: 'Pedra assentada à mão, com argamassa velha. Nenhuma pedra cede ao empurrão.' },
  caverna: { achado: 'Chão de pedra gasto. O caminho mais pisado é fácil de seguir: passa gente por aqui todo dia.' },
  grama: { achado: 'Capim amassado em trilha: muitos pés pequenos, indo e voltando, e há pouco tempo.' },
  estrada: { achado: 'Terra batida, com sulco de roda e marca de casco. Nada recente fora do comum.' },
  fogueira: { achado: 'Brasa viva debaixo da cinza: quem pisa ali leva fogo, e quem cai em cima leva mais. Dá para abafá-la com terra.' },
  braseiro: { achado: 'Ferro quente, carvão em brasa. Tombá-lo espalharia fogo pelo chão.' },
  braseiroFrio: { achado: 'Carvão apagado e frio: ninguém o acende há dias.' },
  entulho: { achado: 'Pedra solta e cascalho: terreno difícil. Tudo aqui caiu de algum lugar acima.' },
  estalagmite: { achado: 'Um cone de rocha da altura de um homem, molhado na ponta. Quem se agacha atrás dele fica coberto.' },
  pedra: { achado: 'Uma rocha grande o bastante para se esconder atrás, e pesada demais para mover.' },
  leito: { achado: 'Palha amassada e couro sujo, ainda morno: alguém dormiu aqui há pouco.' },
  mantimentos: { achado: 'Sacos e caixas amarrados com corda, empilhados alto. Dá cobertura a quem luta de trás deles.' },
  caixote: { achado: 'Madeira de caixote, pregada às pressas. Dentro, palha e o que alguém achou que valia guardar.' },
  caixotes: { achado: 'Caixotes empilhados, uns abertos à força. Dá cobertura a quem se esconde atrás.' },
  barris: { achado: 'Barris de aduela, um deles com a tampa forçada. Cheiro de cerveja azeda.' },
  bau: { achado: 'Madeira com ferragens. A tampa não tem tranca à vista.' },
  arca: { achado: 'Uma arca pesada, de cantos reforçados. A fechadura está riscada de quem tentou sem a chave.' },
  ponte: { achado: 'Tábuas remendadas e corda de tripa. Range a cada passo, e os cabos de apoio estão amarrados nas pontas.' },
  tocaia: { achado: 'Ripas de madeira amarradas com tira de couro, com frestas na altura do olho. Daqui se vigia sem ser visto.' },
  espinheiro: { achado: 'Mato fechado e espinhento: terreno difícil, e meia cobertura para quem atira de dentro dele.' },
  mato: { achado: 'Mato alto: atrapalha o passo e esconde quem se abaixa.' },
  arbusto: { achado: 'Moita cerrada, boa de se esconder atrás.' },
  arvore: { achado: 'Tronco grosso, casca marcada de unha na altura do peito.' },
  portaMadeira: { achado: 'Tábuas grossas e dobradiças de ferro sem ferrugem: alguém a usa, e a mantém.' },
  portaAberta: { achado: 'A porta está aberta; as dobradiças não rangem.' },
  passagemAberta: { achado: 'Uma passagem que alguém abriu, e que pode fechar.' },
  ossos: { achado: 'Ossos roídos, a maioria de bicho pequeno. Uns poucos são grandes demais para isso.' },
  teia: { achado: 'Fios grossos e pegajosos: quem passa sem cuidado fica preso neles.' },
  desabamento: { achado: 'Pedra caída de cima. O teto ali não é de confiança.' },
  escada: { achado: 'Degraus gastos no meio, de tanto uso.' },
};

/**
 * O que a atenção acha num corpo, por bloco de criatura. `pericias` diz o teste (Medicina para como morreu,
 * Investigação para o que carrega). Os fatos são do livro; as palavras, nossas.
 */
export const ACHADOS_NO_CORPO = {
  goblin: { achado: 'Os dentes foram limados em ponta, um por um. É a marca da tribo Dentefino — todo goblin dela faz isso.' },
  goblinChefe: { achado: 'Os dentes limados em ponta da tribo Dentefino, e um couro melhor que o dos outros: mandava em alguém.' },
  yeemik: { achado: 'Os dentes limados da tribo Dentefino, e roupa melhor que a dos outros. Uma algibeira presa ao cinto, pesada.' },
  klarg: { achado: 'Mais pele que roupa: um manto de pele de lobo, preso por correia, e o cheiro de carne velha. Ele se achava rei de alguma coisa.' },
  bugbear: { achado: 'Braços longos demais e pés que não fazem barulho: o tipo de coisa que chega por trás.' },
  lobo: { pericias: ['lidarComAnimais', 'medicina'], achado: 'O pescoço é esfolado de coleira, e o corpo tem mordida velha de outros lobos. Foi criado para a briga, não para a caça.' },
  hobgoblin: { achado: 'Armadura cuidada e arma afiada: um soldado, não um saqueador.' },
};
const CORPO_PADRAO = { pericias: ['medicina', 'investigacao'], achado: 'O golpe que o derrubou é fácil de achar. Nada nele diz mais do que isso.' };

export const NOME_DA_PERICIA = {
  investigacao: 'Investigação', percepcao: 'Percepção', medicina: 'Medicina', lidarComAnimais: 'Lidar com Animais',
  sobrevivencia: 'Sobrevivência', natureza: 'Natureza', historia: 'História', arcanismo: 'Arcanismo', religiao: 'Religião',
};

/** Os verbos do menu. `pericias`: as que valem por padrão (rola a melhor). */
export const VERBOS = {
  procurar: { rotulo: 'Procurar', pericias: ['percepcao'] },
  investigar: { rotulo: 'Investigar', pericias: ['investigacao'] },
  rastrear: { rotulo: 'Ler os rastros', pericias: ['sobrevivencia'] },
  lembrar: { rotulo: 'Lembrar', pericias: ['historia', 'arcanismo', 'religiao', 'natureza'] },
  examinar: { rotulo: 'Examinar', pericias: ['medicina'] },
};
const VERBO_DA_PERICIA = {
  percepcao: 'procurar', investigacao: 'investigar', sobrevivencia: 'rastrear', medicina: 'examinar', lidarComAnimais: 'examinar',
  historia: 'lembrar', arcanismo: 'lembrar', religiao: 'lembrar', natureza: 'lembrar',
};
/** O verbo de uma pista: o que ela diz, ou o da primeira perícia dela. */
export const verboDa = (pista) => pista.verbo ?? VERBO_DA_PERICIA[pista.pericias?.[0]] ?? 'investigar';

const sinal = (n) => (n >= 0 ? `+${n}` : `${n}`);
const melhorPericia = (c, pericias) => pericias.reduce((a, b) => (skillBonus(c, b) > skillBonus(c, a) ? b : a));
const herois = (enc) => enc.combatants.filter((h) => h.side === 'party' && !h.dead && h.hp > 0 && h.pos);

/**
 * AJUDAR (SRD): um aliado que podia fazer a mesma coisa dá vantagem a quem tenta. Fora da luta é de graça — basta
 * estar perto do mesmo ponto; na luta custaria a ação dele, então ali o menu não oferece.
 */
export function ajudanteDe(enc, c, onde, alcance = 5, { fora = true } = {}) {
  if (!fora) return null;
  return herois(enc).find((h) => h !== c && !hasCondition(h, 'inconsciente') && distanceFt(h.pos, onde) <= alcance) ?? null;
}

/** O melhor teste entre algumas perícias, com as magias de utilidade (Orientação soma) e a ajuda de um aliado. */
function testar(app, c, pericias, cd, { vantagem = false } = {}) {
  const enc = app.enc;
  const x = ctxDe(app, enc);
  return rolarTeste(x.estado, x.herois(), enc.rng, c, melhorPericia(c, pericias), cd, { vantagem });
}

const registro = (enc) => criarBuscas(enc.investigados ??= {});

/**
 * O DIÁRIO DE PISTAS: o que o grupo achou, na ordem em que achou. Fica no encontro (`enc.diario`) e cada achado
 * também vai para o registro (`enc.say`), que é o que a sala manda para todos os jogadores.
 */
export function anotar(enc, { titulo, texto, heroi = null }) {
  const linhas = [].concat(texto).filter(Boolean);
  if (!linhas.length) return;
  enc.diario ??= [];
  if (enc.diario.some((d) => d.titulo === titulo && d.texto.join(' ') === linhas.join(' '))) return;
  enc.diario.push({ titulo, texto: linhas, heroi: heroi?.name ?? null, rodada: enc.round ?? 0 });
  enc.say?.('acao', `Diário — ${titulo}: ${linhas[0]}`);
}

/** A opção "Diário de pistas": as páginas do que o grupo achou. `null` sem nada anotado. */
export function opcaoDoDiario(app) {
  const diario = app.enc?.diario ?? [];
  if (!diario.length) return null;
  return {
    grupo: 'Grupo', rotulo: 'Diário de pistas', icone: 'acao-usarObjeto', detalhe: `${diario.length} anotação(ões)`,
    fazer: async () => {
      const { narrar } = await import('../view/narrativa.js');
      await narrar(app.root, {
        formato: 'painel',
        paginas: diario.map((d) => ({ titulo: d.titulo, texto: [...d.texto, d.heroi ? `— achado por ${d.heroi}` : ''].filter(Boolean) })),
      });
    },
  };
}

/** Mostra o resultado: o teste e o texto. A tela é da vista (carregada só no navegador). */
async function mostrar(app, titulo, teste, texto) {
  const { narrar } = await import('../view/narrativa.js');
  await narrar(app.root, { formato: 'painel', paginas: [{ titulo, teste, texto: [].concat(texto) }] });
}

/**
 * A opção comum de um verbo: o teste, uma vez por herói e por ponto, a ação na luta (menos `semAcao`).
 * `mostraCd: false` esconde a CD (Procurar: dizer a CD já diria que há algo escondido).
 */
function opcao(app, c, { onde, tipo, rotulo, titulo, alcance = 5, fora, pericias, cd, achado, falha, efeito, mostraCd = true, semAcao = false, anota = true }) {
  const enc = app.enc;
  const buscas = registro(enc);
  const dist = distanceFt(c.pos, onde);
  const longe = dist > alcance ? `chegue mais perto — a ${alcance} pés (está a ${dist})` : null;
  const melhor = melhorPericia(c, pericias);
  const ajuda = ajudanteDe(enc, c, onde, Math.max(5, alcance), { fora });
  const gasta = fora || semAcao ? 'de graça' : 'gasta a ação';
  return {
    rotulo, icone: 'acao-procurar',
    detalhe: [`${NOME_DA_PERICIA[melhor] ?? melhor} ${sinal(skillBonus(c, melhor))}${mostraCd ? `, CD ${cd}` : ''}`,
      ajuda ? `com ${ajuda.name}: vantagem` : null, gasta].filter(Boolean).join(' · '),
    motivo: longe ?? buscas.ja(c, tipo, onde) ?? (!fora && !semAcao && c.actionUsed ? 'a ação deste turno já foi usada' : null),
    fazer: async () => {
      buscas.marcar(c, tipo, onde);
      if (!fora && !semAcao) c.actionUsed = true;
      const t = testar(app, c, pericias, cd, { vantagem: Boolean(ajuda) });
      const texto = t.passou
        ? (typeof achado === 'function' ? achado(c, t) : achado)
        : (falha ?? `${c.name} olha com cuidado e não acha nada além do que já se via.`);
      await mostrar(app, titulo, t, texto);
      if (t.passou) {
        if (anota) anotar(enc, { titulo, texto, heroi: c });
        await efeito?.(c, t);
      }
      app.refresh?.();
      if (!fora && !semAcao) app.afterAct?.();
    },
  };
}

/** Uma pista vira a opção do verbo dela. */
function opcaoDaPista(app, c, tile, pista, { fora, nome }) {
  const verbo = verboDa(pista);
  const v = VERBOS[verbo] ?? VERBOS.investigar;
  return {
    verbo,
    ...opcao(app, c, {
      onde: tile, tipo: verbo, fora,
      rotulo: pista.rotulo ?? v.rotulo,
      titulo: pista.titulo ?? nome ?? 'Investigando',
      alcance: pista.alcance ?? 5,
      pericias: pista.pericias ?? v.pericias,
      cd: pista.cd ?? CD_PADRAO,
      achado: pista.achado, falha: pista.falha, efeito: pista.efeito,
      semAcao: verbo === 'lembrar',
    }),
  };
}

/**
 * Uma opção de atenção para uma casa do mapa, ou `null` se não há o que achar ali. A pista da cena manda; sem
 * ela, vale a da superfície. `pista`: `{ titulo?, rotulo?, verbo?, cd?, pericias?, alcance?, achado, falha?, efeito? }`.
 */
export function opcaoDeInvestigar(app, c, tile, sup, { fora, pista = null, nome = null } = {}) {
  if (!c) return null;
  const base = pista ?? ACHADOS_DA_SUPERFICIE[sup];
  if (!base) return null;
  return opcaoDaPista(app, c, tile, base, { fora, nome });
}

/**
 * PROCURAR (Percepção) em volta de uma casa: a casa e as oito vizinhas. Acha as armadilhas da cena
 * (`capitulo.armadilhas`) e as pistas de Procurar daquela casa. Falhar e não haver nada dizem a mesma coisa — é o
 * que impede o menu de entregar o segredo.
 */
export function opcaoDeProcurar(app, c, tile, { fora, pistas = [], nome = null } = {}) {
  if (!c) return null;
  const enc = app.enc;
  const perto = (p) => Math.abs(p.x - tile.x) <= 1 && Math.abs(p.y - tile.y) <= 1;
  const armadilhas = armadilhasDaCena(app).filter((a) => !a.descoberta && a.casas.some(perto));
  const escondidas = pistas.filter((p) => verboDa(p) === 'procurar');
  const cds = [...armadilhas.map((a) => a.cd ?? CD_PADRAO), ...escondidas.map((p) => p.cd ?? CD_PADRAO)];
  const nada = `${c.name} passa os olhos devagar por tudo em volta: nada fora do lugar.`;
  return {
    verbo: 'procurar',
    ...opcao(app, c, {
      onde: tile, tipo: 'procurar', fora, mostraCd: false, anota: false,
      rotulo: 'Procurar', titulo: escondidas[0]?.titulo ?? nome ?? 'Procurando',
      alcance: escondidas[0]?.alcance ?? 10,
      pericias: ['percepcao'],
      // a CD que vale é a mais fácil do que há ali; sem nada, qualquer resultado acha o mesmo nada
      cd: cds.length ? Math.min(...cds) : CD_PADRAO,
      falha: nada,
      achado: (quem, t) => {
        const linhas = [];
        for (const a of armadilhas) if (t.total >= (a.cd ?? CD_PADRAO)) linhas.push(a.achado);
        for (const p of escondidas) if (t.total >= (p.cd ?? CD_PADRAO)) linhas.push(...[].concat(p.achado));
        return linhas.length ? linhas : nada;
      },
      efeito: async (quem, t) => {
        for (const a of armadilhas) {
          if (t.total < (a.cd ?? CD_PADRAO)) continue;
          anotar(enc, { titulo: a.nome, texto: a.achado, heroi: quem });
          await a.notar?.(quem, { mostrar: false });
        }
        for (const p of escondidas) {
          if (t.total < (p.cd ?? CD_PADRAO)) continue;
          anotar(enc, { titulo: p.titulo ?? nome ?? 'Algo escondido', texto: p.achado, heroi: quem });
          await p.efeito?.(quem, t);
        }
      },
    }),
  };
}

/**
 * Todas as opções de atenção de uma casa: Procurar sempre, e um verbo por pista (a da cena manda sobre a da
 * superfície no mesmo verbo). `pistas`: as da cena e as do editor para esta casa.
 */
export function opcoesDeAtencao(app, c, tile, sup, { fora, pistas = [], nome = null } = {}) {
  if (!c) return [];
  const opcoes = [opcaoDeProcurar(app, c, tile, { fora, pistas, nome })];
  const porVerbo = new Map();
  for (const p of pistas) {
    const v = verboDa(p);
    if (v !== 'procurar' && !porVerbo.has(v)) porVerbo.set(v, p);
  }
  if (!porVerbo.has('investigar') && ACHADOS_DA_SUPERFICIE[sup]) porVerbo.set('investigar', ACHADOS_DA_SUPERFICIE[sup]);
  for (const v of ['investigar', 'rastrear', 'lembrar', 'examinar']) {
    if (porVerbo.has(v)) opcoes.push(opcaoDaPista(app, c, tile, porVerbo.get(v), { fora, nome }));
  }
  return opcoes;
}

/** "Examinar o corpo": o que o bloco de criatura diz, mais o que a cena acrescentar. */
export function opcaoDeExaminarCorpo(app, c, corpo, { fora, extra = null, sufixo = '' } = {}) {
  if (!c) return null;
  const base = extra ?? ACHADOS_NO_CORPO[corpo.defId] ?? CORPO_PADRAO;
  return opcao(app, c, {
    onde: corpo.pos, tipo: `corpo:${corpo.id}`, fora,
    rotulo: `Examinar o corpo${sufixo}`,
    titulo: corpo.name,
    pericias: base.pericias ?? CORPO_PADRAO.pericias,
    cd: base.cd ?? CD_PADRAO,
    achado: base.achado, falha: base.falha, efeito: base.efeito,
  });
}

// ------------------------------------------------------------------------------------------- a criatura ---

/**
 * QUE PERÍCIA LEMBRA QUE CRIATURA. É regra da casa — o SRD não diz —, na divisão que as mesas usam: o que é da
 * natureza, a Natureza; o que é dos deuses e da morte, a Religião; o que é magia, o Arcanismo; gente, a História.
 */
export const PERICIA_DO_TIPO = {
  fera: 'natureza', planta: 'natureza', gosma: 'natureza', monstruosidade: 'natureza', 'feérico': 'natureza',
  'morto-vivo': 'religiao', celestial: 'religiao', corruptor: 'religiao', 'ínfero': 'religiao',
  aberracao: 'arcanismo', 'aberração': 'arcanismo', constructo: 'arcanismo', elemental: 'arcanismo', 'dragão': 'arcanismo', dragao: 'arcanismo',
  humanoide: 'historia', gigante: 'historia',
};
const ND_DO_XP = [[10, 0], [25, 0.125], [50, 0.25], [100, 0.5], [200, 1], [450, 2], [700, 3], [1100, 4], [1800, 5], [2300, 6],
  [2900, 7], [3900, 8], [5000, 9], [5900, 10], [7200, 11], [8400, 12], [10000, 13], [11500, 14], [13000, 15]];
/** O nível de ameaça (ND) pelo XP do bloco, pela tabela do SRD. */
export const ndDe = (xp) => { let nd = 0; for (const [x, n] of ND_DO_XP) if ((xp ?? 0) >= x) nd = n; return nd; };
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}` : xs[0]);
const ND_TEXTO = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' };

/** O que se sabe de um bloco de criatura, em frases. É o que o Lembrar entrega. */
export function saberDaCriatura(m) {
  const linhas = [];
  const tipo = m.tipo ?? 'humanoide';
  const nd = ndDe(m.xp);
  linhas.push(`${tipo[0].toUpperCase()}${tipo.slice(1)}, de nível de ameaça ${ND_TEXTO[nd] ?? nd}.`);
  // a LORE do bestiário (o que se conta dela), quando o bloco traz
  const lore = MONSTERS[m.defId]?.lore;
  if (lore) linhas.push(lore);
  if (m.immune?.length) linhas.push(`Não sente ${lista(m.immune)}.`);
  if (m.resist?.length) linhas.push(`Aguenta bem ${lista(m.resist)}: leva metade.`);
  if (m.resistNaoMagico?.length) linhas.push(`Arma comum faz pouco nele (${lista(m.resistNaoMagico)}); arma mágica e magia, não.`);
  if (m.vulnerable?.length) linhas.push(`O ponto fraco: ${lista(m.vulnerable)} faz o dobro.`);
  if (m.conditionImmunities?.length) linhas.push(`Não pode ficar ${lista(m.conditionImmunities.map((c) => CONDITIONS[c]?.name?.toLowerCase() ?? CONDITIONS[c.normalize('NFD').replace(/[̀-ͯ]/g, '')]?.name?.toLowerCase() ?? c))}.`);
  const NOME_DO_SENTIDO = { darkvisionFt: 'enxerga no escuro', darkvision: 'enxerga no escuro', blindsightFt: 'sente sem ver', blindsight: 'sente sem ver', truesightFt: 'vê as coisas como são', truesight: 'vê as coisas como são', tremorsenseFt: 'sente o tremor do chão', tremorsense: 'sente o tremor do chão' };
  const sentidos = Object.entries(m.senses ?? {}).filter(([k, v]) => v && NOME_DO_SENTIDO[k]).map(([k, v]) => `${NOME_DO_SENTIDO[k]} até ${v} pés`);
  if (sentidos.length) linhas.push(`Sentidos: ${lista(sentidos)}.`);
  const tracos = (m.traits ?? []).map((t) => TRAIT_INFO[t]).filter(Boolean);
  for (const t of tracos.slice(0, 3)) linhas.push(`${t.name}: ${t.desc}`);
  if (linhas.length === 1) linhas.push('Nada nele foge do comum: sem resistência nem truque que se saiba.');
  return linhas;
}

/**
 * "Lembrar o que se sabe" de uma criatura viva à vista: CD 10 + nível de ameaça, uma vez por herói e por bloco. Não
 * custa a ação: é memória. Quem passa sabe as resistências, as imunidades, os sentidos e os traços do bloco.
 */
export function opcaoDeLembrarCriatura(app, c, m, { fora } = {}) {
  if (!c || !m || m.dead || m.side === 'party') return null;
  const pericia = PERICIA_DO_TIPO[m.tipo ?? 'humanoide'] ?? 'historia';
  const cd = 10 + Math.ceil(ndDe(m.xp));
  return opcao(app, c, {
    onde: m.pos, tipo: `lembrar:${m.defId ?? m.name}`, fora, semAcao: true,
    rotulo: 'Lembrar o que se sabe', titulo: m.name, alcance: 120,
    pericias: [pericia], cd,
    achado: () => saberDaCriatura(m),
    falha: `${c.name} já ouviu falar de algo assim, mas não lembra de nada que sirva agora.`,
    efeito: () => marcarConhecida(app, m),
  });
}

/**
 * O BESTIÁRIO DO GRUPO: o bloco que alguém já reconheceu pelo Lembrar. A ficha da criatura (`view/ficha-criatura.js`)
 * só mostra o que se sabe dela depois disso. Mora na campanha (vai no save, por bloco: reconhecer um goblin vale para
 * todos os goblins); sem campanha (a arena), no campo da cena.
 */
const chaveDoBloco = (m) => m.defId ?? m.name;
export function marcarConhecida(app, m) {
  const onde = app.campanha ? (app.campanha.bestiario ??= {}) : (app.enc.conhecidas ??= {});
  onde[chaveDoBloco(m)] = true;
}
export function criaturaConhecida(app, m) {
  return Boolean(app.campanha?.bestiario?.[chaveDoBloco(m)] || app.enc?.conhecidas?.[chaveDoBloco(m)]);
}

// ------------------------------------------------------------------------------------------ a passiva ---

/**
 * O QUE A PERCEPÇÃO PASSIVA NOTA, sem ninguém pedir: as pistas a até 10 pés de um herói, em casa que o grupo
 * vê, cuja CD a passiva dele alcança. Devolve as casas — o tabuleiro põe nelas um brilho discreto, "algo aqui
 * chama a atenção". Some quando alguém já tentou aquele verbo ali.
 */
export function casasNotadas(app, { visao = null } = {}) {
  const enc = app.enc;
  const pistasEm = app.capitulo?.pistasEm ?? ((t, sup, c) => [].concat(app.capitulo?.pistaEm?.(t, sup, c) ?? []));
  const editadas = (t) => [].concat(enc.field.interativos?.get(`${t.x},${t.y}`)?.pista ?? []);
  const buscas = registro(enc);
  const grupo = herois(enc);
  const notadas = new Map();
  for (const h of grupo) {
    const passiva = passivePerception(h);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const t = { x: h.pos.x + dx, y: h.pos.y + dy };
        const k = `${t.x},${t.y}`;
        if (!enc.field.inside(t.x, t.y)) continue;
        if (visao && !visao.has(k)) continue;
        const sup = enc.field.surfaceAt(t.x, t.y);
        const pistas = [...pistasEm(t, sup, h), ...editadas(t)];
        const viva = pistas.find((p) => passiva >= (p.cd ?? CD_PADRAO) && !grupo.some((o) => buscas.ja(o, verboDa(p), t)));
        if (!viva) continue;
        // UM brilho por pista, na casa dela mais perto de quem notou: a pista de área (o teto, o riacho, o canil)
        // cobre dezenas de casas, e acender todas pintava o chão inteiro de faísca — medido, 18 casas num passo.
        const qual = viva.titulo ?? k;
        // casa com ficha esconde a faísca debaixo dela: só serve se a pista não tiver outra
        const d = Math.abs(dx) + Math.abs(dy) + (enc.at?.(t.x, t.y) ? 100 : 0);
        const antes = notadas.get(qual);
        if (!antes || d < antes.d) notadas.set(qual, { x: t.x, y: t.y, d });
      }
    }
  }
  return [...notadas.values()].map(({ x, y }) => ({ x, y }));
}
