// Ficha de personagem e inventário.
//
// POR QUE ISTO EXISTE
// Até agora o jogador via PV, CA e uma barra de ações — e nada mais. Num jogo
// 5e isso esconde metade do personagem: atributo, perícia, resistência,
// talento e equipamento são o que explicam POR QUE um número é o que é. A CA
// 19 da guerreira não é um dado do destino: é 16 de cota de malha + 0 de
// Destreza (que a armadura trava) + 2 de escudo + 1 de Estilo de Luta. Mostrar
// a conta é a diferença entre decorar números e entender o personagem.
//
// E o inventário não é vitrine: `armorStyle`, `weapon` e `shield` são campos
// do LOOK (ver `art/looks/party.js`). Trocar de armadura muda a CA e muda o
// BONECO no mesmo clique, porque não existe arquivo de arte neste repositório
// — a figura é desenhada a partir desses campos.
//
// A ORGANIZAÇÃO
// A aba da FICHA vem das telas de personagem de Baldur's Gate 3, pelo mesmo
// motivo que o HUD: é o mesmo jogo, e aquela arquitetura de informação já
// resolveu problemas que apareceriam aqui de qualquer jeito. Duas colunas,
// mochila em grade, derivados sempre visíveis.
//
// A aba do INVENTÁRIO é um boneco: os quatro derivados que o equipamento muda
// à esquerda, a figura ao centro com os encaixes em anel à volta dela, e a
// mochila à direita. O anel não é enfeite — a figura É desenhada a partir do
// que está nos encaixes, então pôr o encaixe ao lado da peça que ele muda faz
// a troca ler como "vesti isto" em vez de "editei um campo".
//
// A arte é nossa.

import './ficha.css';
import { maxHpEfetivo } from '../rules/conditions.js';

import { makeFigure, makePortrait } from '../art/sheet.js';
import { LOOKS } from '../art/looks.js';
import { temArteImportada } from '../art/folhas/index.js';
import { iconCanvas, iconeDeArma, iconeDeMagia, iconeDeRecurso, temIcone } from '../art/icons.js';
import {
  ABILITIES, ABILITY_NAME, SKILLS, SKILL_NAME,
  abilityMod, skillBonus, saveBonus, passivePerception,
  spellSaveDc, spellAttackBonus,
} from '../rules/abilities.js';
import {
  SLOTS, armorClass,
  itemDeId, nomeDeId, noEncaixe, acBreakdown, weaponLine, aparenciaDe,
  avisoDeArmadura, garantirInventario, conteudoDaMochila, candidatosPara,
  motivoParaRecusar, equipar, cargaDe,
} from '../rules/equipment.js';
import { getSpell } from '../rules/spells.js';
import { spellMod, limiteDePreparacao, fontesDePreparacao } from '../rules/party.js';
import { chanceD20, pct } from '../rules/odds.js';
import { formatModifier } from '../core/dice.js';

/**
 * O mesmo construtor de nó do HUD, repetido aqui de propósito: a ficha não
 * depende de nenhum arquivo que não seja dela, e `hud.js` tem outro dono.
 */
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
};

const SIGLA_ATRIBUTO = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

// O que cada talento FAZ, em uma frase. Um nome de talento sem a frase é um
// enigma: "Esculpir Magias" não diz a ninguém que o cone pode pegar o aliado.
// Os números seguem o que `rules/combat.js` realmente executa — texto de ficha
// que promete o que o motor não faz é pior que texto nenhum.
const TALENTOS = {
  defenseStyle: ['Estilo de Luta: Defesa', '+1 de CA enquanto estiver de armadura.'],
  secondWind: ['Retomar o Fôlego', 'Ação bônus: recupera 1d10 + nível de pontos de vida. Uma carga por descanso.'],
  actionSurge: ['Ação Surpreendente', 'Uma ação EXTRA neste turno, sem gastar nada do resto. Uma carga por descanso.'],
  sneakAttack: ['Ataque Furtivo', 'Dano extra quando você tem vantagem, ou quando um aliado está encostado no alvo. Uma vez por turno.'],
  cunningAction: ['Ação Ardilosa', 'Ação bônus: corre e desengaja de uma vez — sai de perto sem levar ataque de oportunidade.'],
  discipleOfLife: ['Discípulo da Vida', 'Toda cura de magia de 1º círculo ou mais rende 2 + o círculo da magia a mais.'],
  preserveLife: ['Preservar a Vida', 'Canalizar Divindade: 5 × nível de PV para dividir entre os feridos a até 9 m, até metade dos PV máximos de cada um.'],
  sculptSpells: ['Esculpir Magias', 'Escolhe 1 + o círculo da magia de aliados dentro da área: eles não sofrem nada.'],
};

/** Iniciais para o soquete de um item que ainda não tem ícone desenhado. */
const CONECTIVOS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const sigla = (nome = '') => nome
  .split(/\s+/)
  .filter((p) => p && !CONECTIVOS.has(p.toLowerCase()))
  .slice(0, 2)
  .map((p) => p[0].toUpperCase())
  .join('');

/**
 * Ícone de um item, com recuo honesto.
 *
 * Arma e magia já têm ícone em `art/icons.js`. Armadura, escudo, corda, ração
 * e moeda ainda não — e emoji está fora de questão. Até o desenho existir, o
 * soquete leva as iniciais em serifa: lê como placa gravada, e no dia em que o
 * ícone entrar o nome em `art` acende sozinho.
 */
export function iconeDeItem(id, alvo = 32) {
  const achado = itemDeId(id);
  if (!achado) return el('span', { class: 'sigla' }, '—');
  const { tipo, dados } = achado;
  // O ícone do próprio item primeiro; o genérico da família, se ainda não houver.
  if (temIcone(`item-${id}`)) return iconCanvas(`item-${id}`, alvo);
  const nome = tipo === 'arma' ? iconeDeArma(dados.art, dados.name) : dados.art;
  if (nome && temIcone(nome)) return iconCanvas(nome, alvo);
  return el('span', { class: 'sigla' }, sigla(dados.name));
}

/**
 * Põe no boneco o que está nos encaixes.
 *
 * A folha de sprites de `art/sheet.js` é cacheada POR CHAVE DE LOOK. Reescrever
 * o look no lugar não mudaria nada na tela: a folha velha continuaria em cache.
 * Então cada combinação de armadura, arma e escudo ganha a sua própria chave,
 * registrada no mesmo registro que o pintor consulta.
 *
 * Exportada porque o grupo tem de entrar no tabuleiro JÁ VESTIDO com o que
 * escolheu na criação (`main.js`, ao montar o encontro) -- antes, a figura só
 * trocava de arma quando alguém abria a ficha.
 */
export function aplicarAparencia(personagem) {
  // um estado na chave (`~furia`) nao e a figura: a base fica sem ele, e ele
  // volta para a chave nova -- trocar de arma em furia continua em furia
  const [semEstado, estado] = String(personagem.look).split('~');
  const base = (personagem.lookBase ??= semEstado);
  const look = LOOKS[base];
  if (!look) return;
  const ap = aparenciaDe(personagem);

  // FIGURA COM ARTE DO PIXELLAB: a chave leva os ITENS, não o estilo do
  // pintor. O pintor junta cota de malha e placas em `plate`, e espada longa e
  // espada grande em `sword`; para a arte importada são folhas diferentes.
  // Quem escolhe a folha a partir da chave é `folhaImportada`, que nunca cai
  // no pintor enquanto houver uma folha da figura -- a Dara não vira humana.
  if (temArteImportada(base)) {
    // a arma da mao secundaria entra com `+`: `rogue@couro-espadaCurta+adaga`
    const segunda = personagem.offhandWeapon ? `+${personagem.offhandWeapon}` : '';
    const chave = `${base}@${personagem.armor ?? 'nenhuma'}-${personagem.equippedWeapon ?? 'nada'}`
      + `${segunda}${ap.shield ? '-escudo' : ''}`;
    if (!LOOKS[chave]) LOOKS[chave] = { ...look, ...ap };
    personagem.look = estado ? `${chave}~${estado}` : chave;
    return;
  }

  const igualAoBase = look.armorStyle === ap.armorStyle
    && (look.weapon ?? null) === ap.weapon
    && Boolean(look.shield) === ap.shield;
  if (igualAoBase) { personagem.look = base; return; }

  const chave = `${base}@${ap.armorStyle}-${ap.weapon ?? 'desarmado'}${ap.shield ? '-escudo' : ''}`;
  if (!LOOKS[chave]) LOOKS[chave] = { ...look, ...ap };
  personagem.look = chave;
}

/**
 * @param {HTMLElement} root  onde a janela é pendurada (o mesmo root do HUD)
 * @param {{
 *   onEquipar?: (personagem: object, troca: object) => void,
 *   onFechar?: () => void,
 *   podeEquipar?: (personagem: object, slot: string) => string|null,
 *   dica?: (node: HTMLElement, dados: object) => HTMLElement,
 * }} handlers
 */
export function criarFicha(root, handlers = {}) {
  let personagem = null;
  let aba = 'ficha';
  let encaixeAberto = null;
  let aviso = null;

  const janela = el('div', { class: 'ficha-janela', role: 'dialog', 'aria-modal': 'true' });
  const overlay = el('div', { class: 'ficha-overlay' }, janela);
  overlay.style.display = 'none';
  // Clique FORA fecha; clique dentro não pode fechar, então a janela para o
  // evento antes de ele chegar no véu.
  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) fechar(); });
  root.append(overlay);

  const estaAberta = () => overlay.style.display !== 'none';

  function comDica(node, dados) {
    if (handlers.dica) return handlers.dica(node, dados) ?? node;
    // Sem a dica rica do HUD, o título do navegador é melhor que nada.
    const linhas = [
      dados.nome,
      ...(dados.linhas ?? []).filter(Boolean).map(([r, v]) => `${r}: ${v}`),
      dados.texto, dados.aviso,
    ].filter(Boolean);
    node.setAttribute('title', linhas.join('\n'));
    return node;
  }

  // ---- cabeça -------------------------------------------------------------

  function cabeca() {
    const retrato = makePortrait(personagem.look, 52);
    retrato.className = 'pixel';
    const botaoAba = (id, icone, texto) => el('button', {
      class: `ficha-aba${aba === id ? ' on' : ''}`,
      onclick: () => { aba = id; encaixeAberto = null; render(); },
    }, temIcone(icone) ? iconCanvas(icone, 16) : null, texto);

    return el('div', { class: 'ficha-cabeca' },
      el('div', { class: 'ficha-cabeca-retrato' }, retrato),
      el('div', {},
        el('div', { class: 'ficha-nome' }, personagem.name),
        el('div', { class: 'ficha-linhagem' },
          personagem.invocado ? `Invocado · ${personagem.ancestry}` : `${personagem.className} ${personagem.ancestry} · nível ${personagem.level}`)),
      el('div', { class: 'ficha-abas' },
        botaoAba('ficha', 'ficha', 'Ficha'),
        botaoAba('inventario', 'mochila', 'Inventário')),
      el('button', { class: 'ficha-fechar', title: 'Fechar (Esc)', onclick: () => fechar() }, '×'));
  }

  // ---- aba da ficha -------------------------------------------------------

  function blocoAtributos() {
    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Atributos'),
      el('div', { class: 'atributos' }, ABILITIES.map((a) => {
        const valor = personagem.abilities[a];
        const mod = abilityMod(valor);
        return comDica(
          el('div', { class: 'atributo' },
            el('span', { class: 'atributo-rot' }, SIGLA_ATRIBUTO[a]),
            el('span', { class: 'atributo-val' }, valor),
            el('span', { class: 'atributo-mod' }, formatModifier(mod))),
          {
            nome: ABILITY_NAME[a],
            linhas: [['Valor', String(valor)], ['Modificador', formatModifier(mod)]],
            texto: 'O modificador é o que entra em toda rolagem: (valor − 10) dividido por dois, para baixo.',
          },
        );
      })));
  }

  function linhaDeTeste({ nome, atributo, proficiente, especialista, total, dica }) {
    const pip = el('span', { class: `pip-prof${especialista ? ' on exp' : proficiente ? ' on' : ''}` });
    return comDica(
      el('div', { class: `linha${proficiente || especialista ? ' prof' : ''}` },
        pip,
        el('span', { class: 'linha-nome' }, nome),
        el('span', { class: 'linha-atr' }, SIGLA_ATRIBUTO[atributo]),
        el('span', { class: 'linha-val' }, formatModifier(total))),
      dica,
    );
  }

  function blocoResistencias() {
    const prof = personagem.proficiency ?? 2;
    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Resistências'),
      el('div', { class: 'linhas' }, ABILITIES.map((a) => {
        const proficiente = Boolean(personagem.saves?.includes(a));
        const total = saveBonus(personagem, a);
        return linhaDeTeste({
          nome: ABILITY_NAME[a],
          atributo: a,
          proficiente,
          especialista: false,
          total,
          dica: {
            nome: `Resistência de ${ABILITY_NAME[a]}`,
            linhas: [
              ['Modificador', formatModifier(abilityMod(personagem.abilities[a]))],
              proficiente ? ['Proficiência', formatModifier(prof)] : null,
              ['Total', formatModifier(total)],
            ],
            texto: proficiente
              ? 'Proficiente: é nesta resistência que o personagem aguenta o que a classe dele deveria aguentar.'
              : 'Sem proficiência: só o modificador do atributo.',
          },
        });
      })));
  }

  function blocoPericias() {
    const prof = personagem.proficiency ?? 2;
    const ordenadas = Object.keys(SKILLS).sort((a, b) => SKILL_NAME[a].localeCompare(SKILL_NAME[b], 'pt-BR'));
    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Perícias'),
      el('div', { class: 'linhas duas' }, ordenadas.map((s) => {
        const especialista = Boolean(personagem.expertise?.includes(s));
        const proficiente = Boolean(personagem.skills?.includes(s)) || especialista;
        const total = skillBonus(personagem, s);
        return linhaDeTeste({
          nome: SKILL_NAME[s],
          atributo: SKILLS[s],
          proficiente,
          especialista,
          total,
          dica: {
            nome: SKILL_NAME[s],
            tipo: especialista ? 'especialidade' : proficiente ? 'proficiente' : null,
            linhas: [
              ['Atributo', ABILITY_NAME[SKILLS[s]]],
              ['Modificador', formatModifier(abilityMod(personagem.abilities[SKILLS[s]]))],
              proficiente ? ['Proficiência', formatModifier(especialista ? prof * 2 : prof)] : null,
              ['Total', formatModifier(total)],
            ],
            texto: especialista ? 'Especialidade: a proficiência conta dobrada.' : null,
          },
        });
      })));
  }

  function numero(rot, val, nota, { destaque = false, dica = null } = {}) {
    const node = el('div', { class: `numero${destaque ? ' destaque' : ''}` },
      el('span', { class: 'numero-rot' }, rot),
      el('span', { class: 'numero-val' }, val),
      nota ? el('span', { class: 'numero-nota' }, nota) : null);
    return dica ? comDica(node, dica) : node;
  }

  function blocoDerivados() {
    const ca = acBreakdown(personagem);
    const pv = Math.max(0, Math.ceil(personagem.hp ?? maxHpEfetivo(personagem)));
    const dex = abilityMod(personagem.abilities.dex);
    const prof = personagem.proficiency ?? 2;
    const desloc = personagem.speedFt ?? 30;

    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Números derivados'),
      el('div', { class: 'derivados' },
        numero('CA', ca.total, null, {
          destaque: true,
          dica: { nome: 'Classe de armadura', texto: 'A conta inteira está logo abaixo.' },
        }),
        numero('PV', `${pv}/${maxHpEfetivo(personagem)}`, personagem.tempHp ? `+${personagem.tempHp} temporários` : null),
        numero('Deslocamento', `${desloc}`, `pés · ${Math.floor(desloc / 5)} quadrados`),
        numero('Iniciativa', formatModifier(dex), 'modificador de DES'),
        numero('Proficiência', formatModifier(prof), `nível ${personagem.level}`),
        numero('Percepção', String(passivePerception(personagem)), 'passiva')),
      el('div', { class: 'sub-rot' }, 'A conta da CA'),
      el('div', { class: 'conta' },
        ...ca.partes.map((p) => el('div', { class: 'conta-linha' },
          el('span', {},
            el('span', { class: 'conta-rot' }, p.rotulo),
            ' ',
            el('span', { class: 'conta-nota' }, p.nota)),
          el('span', { class: 'conta-val' }, p.valor >= 0 ? `+${p.valor}` : String(p.valor)))),
        el('div', { class: 'conta-linha total' },
          el('span', { class: 'conta-rot' }, 'Classe de armadura'),
          el('span', { class: 'conta-val' }, ca.total))));
  }

  function blocoTalentos() {
    const lista = (personagem.features ?? []).map((f) => {
      const t = TALENTOS[f];
      if (!t) return null;
      const extra = f === 'sneakAttack' && personagem.sneakAttack ? ` Hoje são ${personagem.sneakAttack}.` : '';
      // O ícone do recurso, quando existe, fica à esquerda — o mesmo que o
      // jogador vê no azulejo da barra de ações, para ligar a frase ao botão.
      const icone = iconeDeRecurso(f);
      return el('div', { class: `talento${icone ? ' com-icone' : ''}` },
        icone ? iconCanvas(icone, 32) : null,
        el('div', { class: 'talento-corpo' },
          el('div', { class: 'talento-nome' }, t[0]),
          el('p', { class: 'talento-texto' }, t[1] + extra)));
    }).filter(Boolean);
    if (!lista.length) return null;
    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Talentos de classe'),
      lista);
  }

  function blocoConjuracao() {
    const sc = personagem.spellcasting;
    if (!sc) return null;
    const dc = spellSaveDc(personagem);
    const atk = spellAttackBonus(personagem);

    const chip = (sid) => {
      const s = getSpell(sid);
      return comDica(
        el('div', { class: `chip${s.level === 0 ? ' truque' : ''}` },
          iconCanvas(iconeDeMagia({ ...s, id: sid }), 16),
          s.name,
          el('span', { class: 'chip-nivel' }, s.level === 0 ? 'truque' : `${s.level}º`)),
        {
          nome: s.name,
          tipo: s.level === 0 ? 'truque' : `magia de ${s.level}º círculo`,
          linhas: [
            s.damage ? ['Dano', `${s.damage}${s.damageType ? ` ${s.damageType}` : ''}`] : null,
            s.heal ? ['Cura', s.heal] : null,
            s.rangeFt ? ['Alcance', `${s.rangeFt} pés`] : null,
            s.kind === 'attack' ? ['Ataque de magia', formatModifier(atk)] : null,
            s.save ? ['Resistência', `${s.save} CD ${dc}`] : null,
          ],
          texto: s.desc,
          custo: s.foraDeCombate ? '10 minutos' : s.castTime === 'bonus' ? 'Ação bônus' : 'Ação',
        },
      );
    };

    const espacos = [];
    for (let lvl = 1; lvl < (sc.slots?.length ?? 0); lvl++) {
      const max = sc.slotsMax?.[lvl] ?? 0;
      if (!max) continue;
      espacos.push(`${lvl}º ${sc.slots[lvl] ?? 0}/${max}`);
    }

    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Conjuração'),
      el('div', { class: 'derivados' },
        numero('Atributo', SIGLA_ATRIBUTO[sc.ability], ABILITY_NAME[sc.ability]),
        numero('CD', String(dc), 'das resistências', {
          dica: { nome: 'CD das magias', texto: '8 + proficiência + modificador de conjuração. É contra isto que o alvo resiste.' },
        }),
        numero('Ataque', formatModifier(atk), 'de magia'),
        numero('Espaços', espacos.length ? espacos.join(' · ') : '—', 'restantes')),
      el('div', { class: 'sub-rot' }, 'Truques — sempre prontos, não ocupam vaga'),
      el('div', { class: 'chips' }, (sc.cantrips ?? []).map(chip)),
      blocoPreparacao(chip));
  }

  /**
   * Preparar magias.
   *
   * POR QUE É UMA TELA E NÃO UMA LISTA
   * `prepared` era um campo fixo em `party.js`: o mago abria a ficha, via as
   * magias dele e não podia fazer nada a respeito. Preparar é a decisão que
   * define o mago em 5e — é onde ele escolhe para que serve hoje.
   *
   * O LIMITE É A REGRA, e está escrito na tela: modificador de conjuração +
   * nível. Quando ele estoura, o que falta não é desabilitado em silêncio —
   * a contagem fica vermelha e o motivo aparece. Botão que não responde e não
   * explica é pior que botão ausente.
   */
  function blocoPreparacao(chip) {
    const sc = personagem.spellcasting;
    const limite = limiteDePreparacao(personagem);
    const fonte = fontesDePreparacao(personagem).filter((id) => getSpell(id).level > 0);
    const preparadas = new Set(sc.prepared ?? []);
    const cheio = preparadas.size >= limite;
    const podeTrocar = handlers.podePreparar?.(personagem) ?? null;

    const linha = (id) => {
      const s = getSpell(id);
      const ligada = preparadas.has(id);
      // Desmarcar sempre pode; marcar só até o limite. Nunca ficar preso com
      // o limite estourado é o que importa aqui.
      const travada = Boolean(podeTrocar) || (!ligada && cheio);
      const node = el('button', {
        class: `prep${ligada ? ' on' : ''}${travada ? ' travada' : ''}`,
        onclick: () => alternarPreparo(id),
      },
        el('span', { class: `pip-prof${ligada ? ' on' : ''}` }),
        iconCanvas(iconeDeMagia({ ...s, id }), 16),
        el('span', { class: 'prep-nome' }, s.name),
        el('span', { class: 'chip-nivel' }, `${s.level}º`));
      return comDica(node, {
        nome: s.name,
        tipo: `magia de ${s.level}º círculo`,
        texto: s.desc,
        aviso: podeTrocar ?? (travada ? `Já tem ${limite} preparadas — desmarque uma antes` : null),
      });
    };

    return el('div', {},
      el('div', { class: 'sub-rot' },
        sc.livro ? 'Preparar do livro de magias' : 'Preparar da lista da classe'),
      // Dito na tela, não só no código: o jogador tem de saber onde o jogo se
      // afasta da regra que ele conhece.
      el('p', { class: 'prep-nota' },
        'No 5e isto acontece num descanso longo. Aqui não há descanso, então a troca vale no turno do grupo.'),
      el('div', { class: `prep-conta${cheio ? ' cheio' : ''}` },
        `${preparadas.size} de ${limite} preparadas`,
        el('span', { class: 'prep-formula' },
          ` · ${SIGLA_ATRIBUTO[sc.ability]} ${formatModifier(spellMod(personagem))} + nível ${personagem.level}`)),
      el('div', { class: 'prep-lista' }, fonte.map(linha)));
  }

  function alternarPreparo(id) {
    const veto = handlers.podePreparar?.(personagem);
    if (veto) { aviso = veto; render(); return; }

    const sc = personagem.spellcasting;
    const atuais = new Set(sc.prepared ?? []);
    if (atuais.has(id)) {
      atuais.delete(id);
    } else {
      if (atuais.size >= limiteDePreparacao(personagem)) {
        aviso = `${personagem.name} já tem ${limiteDePreparacao(personagem)} magias preparadas — desmarque uma antes.`;
        render();
        return;
      }
      atuais.add(id);
    }
    // A ORDEM DO LIVRO, não a ordem dos cliques: a barra de ação lê este
    // array, e remarcar uma magia a mandaria para o fim da fila — o atalho de
    // teclado dela mudaria sem ninguém ter pedido.
    sc.prepared = fontesDePreparacao(personagem).filter((s) => atuais.has(s));
    aviso = null;
    handlers.onPreparar?.(personagem);
    render();
  }

  function painelFicha() {
    return el('div', { class: 'ficha-colunas' },
      el('div', { class: 'ficha-coluna' }, blocoAtributos(), blocoResistencias(), blocoPericias()),
      el('div', { class: 'ficha-coluna' }, ...[blocoDerivados(), blocoTalentos(), blocoConjuracao()].filter(Boolean)));
  }

  // ---- aba do inventário --------------------------------------------------

  /** O que o item DÁ, em uma linha. É o motivo de alguém abrir o inventário. */
  function oQueDa(id) {
    const achado = itemDeId(id);
    if (!achado) return '—';
    const { tipo, dados } = achado;
    if (tipo === 'arma') {
      const w = weaponLine(personagem, id);
      return `${formatModifier(w.bonus)} para acertar · ${w.dano} ${dados.type} · ${w.alcanceFt} pés`;
    }
    if (tipo === 'armadura') {
      if (id === 'nenhuma') return 'CA 10 + Destreza inteira';
      return `CA base ${dados.base} · Des ${dados.dexCap === Infinity ? 'sem limite' : `até +${dados.dexCap}`}`;
    }
    if (tipo === 'escudo') return `+${dados.ac} de CA · ocupa uma mão`;
    return dados.tipo ?? '';
  }

  function dicaDeItem(id) {
    const achado = itemDeId(id);
    if (!achado) return { nome: '—' };
    const { tipo, dados } = achado;
    const linhas = [];
    if (tipo === 'arma') {
      const w = weaponLine(personagem, id);
      linhas.push(['Acerto', formatModifier(w.bonus)], ['Dano', `${w.dano} ${dados.type}`],
        ['Alcance', `${w.alcanceFt} pés`]);
      // A chance sai de `rules/odds.js`, a conta oficial do jogo, e não de uma
      // fórmula escrita aqui. CA 15 é a referência porque é a CA do goblin e
      // do hobgoblin: dá para comparar duas armas sem ter alvo na tela.
      linhas.push(['Acerta CA 15', pct(chanceD20(w.bonus, 15))]);
      if (dados.props?.length) linhas.push(['Propriedades', dados.props.join(', ')]);
    } else if (tipo === 'armadura' && id !== 'nenhuma') {
      linhas.push(['CA base', String(dados.base)],
        ['Limite de Destreza', dados.dexCap === Infinity ? 'sem limite' : `+${dados.dexCap}`],
        ['CA se vestir', String(armorClass({ ...personagem, armor: id }))]);
    } else if (tipo === 'escudo') {
      linhas.push(['CA', `+${dados.ac}`]);
    } else if (tipo === 'item') {
      if (dados.cura) linhas.push(['Cura', dados.cura]);
      if (dados.damage && dados.damage !== '0') linhas.push(['Dano', `${dados.damage} ${dados.damageType}`]);
      if (dados.usos) linhas.push(['Usos', String(dados.usos)]);
      if (dados.raridade) linhas.push(['Raridade', dados.raridade]);
      if (dados.sintonia) linhas.push(['Sintonia', 'exige']);
    }
    // Peso e preço valem para TODA categoria, não só para `item`: a armadura
    // de reserva é o objeto mais pesado da mochila e era o único sem o número.
    if (dados.peso) linhas.push(['Peso', `${dados.peso} lb`]);
    if (dados.custo) linhas.push(['Preço', `${dados.custo} po`]);
    return { nome: dados.name, tipo: dados.tipo ?? tipo, linhas, texto: dados.desc ?? null };
  }

  /** Quanto a CA muda se este item entrar no encaixe. Só armadura e escudo. */
  function deltaDeCa(slot, id) {
    if (slot !== 'armadura' && slot !== 'escudo') return null;
    const hipotese = slot === 'armadura'
      ? { ...personagem, armor: id ?? 'nenhuma' }
      : { ...personagem, shield: Boolean(id) };
    return armorClass(hipotese) - armorClass(personagem);
  }

  // O ANEL DE ENCAIXES
  // Quatro posições em volta do boneco, como na referência: o que veste em
  // cima, a mão que ataca à esquerda, o escudo à direita, a mão livre embaixo.
  // São os quatro encaixes que as REGRAS têm. Capacete e botas apareceriam
  // bem na moldura e seriam encaixe sem efeito nenhum na CA — decoração que
  // mente sobre o que o jogo simula.
  const ANEL = {
    armadura: 'topo',
    maoPrincipal: 'esq',
    escudo: 'dir',
    maoSecundaria: 'baixo',
  };

  function encaixeDoAnel(slot) {
    const id = noEncaixe(personagem, slot.id);
    // 'nenhuma' é uma armadura de verdade no catálogo (CA 10 + Destreza
    // inteira), então o encaixe de armadura nunca está "vazio".
    const vazio = (!id || id === 'nenhuma') && slot.id !== 'armadura';
    const node = el('button', {
      class: `encaixe pos-${ANEL[slot.id]}${vazio ? ' vazio' : ''}${encaixeAberto === slot.id ? ' on' : ''}`,
      onclick: () => { encaixeAberto = encaixeAberto === slot.id ? null : slot.id; render(); },
    },
      el('div', { class: 'encaixe-soquete' },
        vazio ? el('span', { class: 'sigla' }, '·') : iconeDeItem(id)),
      el('span', { class: 'encaixe-rot' }, slot.name),
      el('span', { class: 'encaixe-nome' }, vazio ? 'vazio' : nomeDeId(id)));

    tornarAlvoDeEncaixe(node, slot.id);
    // O que já está equipado também se arrasta — para outro encaixe ou de
    // volta para a mochila.
    if (!vazio) tornarArrastavel(node, id);

    return comDica(node, {
      nome: vazio ? slot.name : nomeDeId(id),
      tipo: slot.name,
      texto: vazio ? 'Encaixe vazio.' : oQueDa(id),
      aviso: 'Clique para trocar',
    });
  }

  function boneco() {
    // Idempotente, e barata quando nada mudou: garante que a figura já abra
    // vestindo o que está nos encaixes, não só depois da primeira troca.
    aplicarAparencia(personagem);
    // 4× e não 3×: o recuo do palco reserva 196 px para os encaixes, e a 3×
    // a figura ficava pequena no meio de todo esse pergaminho. A 4× um humano
    // dá 248 px e passa a dominar o painel, que é o ponto de um boneco.
    const figura = makeFigure(personagem.look, 4);
    figura.className = 'boneco-figura';

    return el('div', { class: 'boneco' },
      el('div', { class: 'boneco-palco' },
        el('div', { class: 'boneco-halo' }),
        figura,
        ...SLOTS.map(encaixeDoAnel)),
      encaixeAberto ? trocador(encaixeAberto) : null);
  }

  /** A coluna de derivados do conceito A: os quatro números que o equipamento
   *  muda. Carga entra aqui e não na ficha porque é o único lugar onde ela
   *  responde a um clique. */
  function colunaDerivados() {
    const ca = acBreakdown(personagem);
    const pv = Math.max(0, Math.ceil(personagem.hp ?? maxHpEfetivo(personagem)));
    const desloc = personagem.speedFt ?? 30;
    const carga = cargaDe(personagem);

    return el('div', { class: 'inv-numeros' },
      numero('Classe de armadura', ca.total, null, {
        destaque: true,
        dica: {
          nome: 'Classe de armadura',
          linhas: ca.partes.map((p) => [p.rotulo, p.valor >= 0 ? `+${p.valor}` : String(p.valor)]),
          texto: 'A conta inteira está na aba da ficha.',
        },
      }),
      numero('Pontos de vida', `${pv}/${maxHpEfetivo(personagem)}`,
        personagem.tempHp ? `+${personagem.tempHp} temporários` : null),
      numero('Deslocamento', String(desloc), `pés · ${Math.floor(desloc / 5)} quadrados`),
      numero('Carga', String(carga.peso), `de ${carga.capacidade} lb`));
  }

  function trocador(slotId) {
    const slot = SLOTS.find((s) => s.id === slotId);
    const opcoes = candidatosPara(personagem, slotId);
    if (!opcoes.length) {
      return el('div', { class: 'trocador' },
        el('div', { class: 'trocador-tit' }, `nada para pôr em ${slot.name.toLowerCase()}`));
    }
    return el('div', { class: 'trocador' },
      el('div', { class: 'trocador-tit' }, `trocar ${slot.name.toLowerCase()}`),
      ...opcoes.map((id) => {
        const vazio = !id || id === 'nenhuma';
        const delta = deltaDeCa(slotId, id);
        const node = el('button', { class: 'opcao', onclick: () => trocar(slotId, id) },
          vazio && id !== 'nenhuma' ? el('span', { class: 'sigla' }, '·') : iconeDeItem(id, 32),
          el('span', {}, id === 'nenhuma' ? 'Sem armadura' : vazio ? 'Deixar vazio' : nomeDeId(id)),
          delta === null || delta === 0
            ? el('span', { class: 'opcao-delta' }, vazio ? '' : (weaponLine(personagem, id)?.dano ?? ''))
            : el('span', { class: `opcao-delta ${delta > 0 ? 'sobe' : 'desce'}` }, `${delta > 0 ? '+' : ''}${delta} CA`));
        return comDica(node, dicaDeItem(id === 'nenhuma' ? 'nenhuma' : id));
      }));
  }

  /** O encaixe natural de um item, para o clique na grade equipar de primeira. */
  function encaixeNatural(id) {
    const achado = itemDeId(id);
    if (!achado) return null;
    if (achado.tipo === 'armadura') return 'armadura';
    if (achado.tipo === 'escudo') return 'escudo';
    if (achado.tipo !== 'arma') return null;
    if (!motivoParaRecusar(personagem, 'maoPrincipal', id)) return 'maoPrincipal';
    if (!motivoParaRecusar(personagem, 'maoSecundaria', id)) return 'maoSecundaria';
    return 'maoPrincipal'; // deixa a recusa falar, com o motivo certo
  }

  /** Peso de uma entrada inteira da mochila, arredondado a uma casa. */
  function pesoDaPilha(e) {
    const unidade = itemDeId(e.id)?.dados.peso ?? 0;
    return Math.round(unidade * e.qtd * 10) / 10;
  }

  function blocoMochila() {
    const conteudo = conteudoDaMochila(personagem);
    const celulas = conteudo.map((e) => {
      const slot = encaixeNatural(e.id);
      const usavel = Boolean(itemDeId(e.id)?.dados.consumivel);
      const node = el('button', {
        class: `celula${slot ? ' equipavel' : ''}${usavel ? ' usavel' : ''}`,
        onclick: () => {
          if (slot) { trocar(slot, e.id); return; }
          // Clicar numa poção tem de BEBÊ-LA. A resposta antiga era "é item
          // de mochila", o que é verdade e não serve para nada.
          if (usavel) { usar(e.id); return; }
          aviso = `${nomeDeId(e.id)} não vai em encaixe nenhum e não é item de usar.`;
          render();
        },
      },
        iconeDeItem(e.id),
        el('span', { class: 'celula-nome' }, nomeDeId(e.id)),
        // O peso da PILHA, não o da unidade: na hora de largar coisa, o que
        // importa é quanto sai da mochila, e três cordas são trinta libras.
        pesoDaPilha(e) > 0 ? el('span', { class: 'celula-peso' }, `${pesoDaPilha(e)} lb`) : null,
        e.qtd > 1 ? el('span', { class: 'celula-qtd' }, e.qtd) : null);
      tornarArrastavel(node, e.id);
      const dados = dicaDeItem(e.id);
      return comDica(node, {
        ...dados,
        aviso: slot
          ? 'Clique ou arraste até o encaixe'
          : usavel ? 'Clique para usar' : null,
      });
    });

    return tornarAlvoDeMochila(el('section', { class: 'bloco bloco-mochila' },
      el('h3', { class: 'bloco-tit' }, 'Mochila'),
      celulas.length
        ? el('div', { class: 'mochila' }, celulas)
        : el('div', { class: 'mochila-vazia' }, 'Mochila vazia. Arraste o que estiver equipado para cá.')));
  }

  function painelInventario() {
    return el('div', { class: 'inv' }, colunaDerivados(), boneco(), blocoMochila());
  }

  // ---- arrastar e soltar --------------------------------------------------
  //
  // POR QUE EXISTE
  // Clicar já equipava, e funcionava. Mas arrastar é o que todo mundo tenta
  // primeiro num inventário — e um gesto que não responde lê como tela
  // quebrada, não como tela que prefere outro gesto.
  //
  // O ID VIAJA NUMA VARIÁVEL, não só no `dataTransfer`. O `dataTransfer` é a
  // forma correta e continua sendo preenchido, mas `dragover` não deixa ler o
  // que está sendo arrastado — e é em `dragover` que se decide se o encaixe
  // aceita ou recusa o que vem vindo. Sem a variável, o encaixe só descobre
  // que não cabia DEPOIS de soltar.

  let arrastando = null;

  function tornarArrastavel(node, id) {
    node.setAttribute('draggable', 'true');
    node.addEventListener('dragstart', (e) => {
      arrastando = id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      node.classList.add('arrastando');
    });
    node.addEventListener('dragend', () => {
      arrastando = null;
      node.classList.remove('arrastando');
      // As marcas de alvo ficam em nós que o `render()` vai recriar, mas o
      // `dragend` pode chegar sem render nenhum (soltou fora de tudo).
      for (const el2 of janela.querySelectorAll('.aceita, .recusa')) {
        el2.classList.remove('aceita', 'recusa');
      }
    });
    return node;
  }

  function tornarAlvoDeEncaixe(node, slotId) {
    node.addEventListener('dragover', (e) => {
      if (!arrastando) return;
      const recusa = motivoParaRecusar(personagem, slotId, arrastando);
      node.classList.toggle('aceita', !recusa);
      node.classList.toggle('recusa', Boolean(recusa));
      // Só `preventDefault` deixa soltar. Não chamar no caso recusado é o que
      // faz o cursor dizer "não" sem precisar de texto.
      if (!recusa) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
    });
    node.addEventListener('dragleave', () => node.classList.remove('aceita', 'recusa'));
    node.addEventListener('drop', (e) => {
      e.preventDefault();
      node.classList.remove('aceita', 'recusa');
      const id = arrastando ?? e.dataTransfer.getData('text/plain');
      arrastando = null;
      if (id) trocar(slotId, id);
    });
    return node;
  }

  /** A mochila aceita o que sair de um encaixe: soltar aqui é desequipar. */
  function tornarAlvoDeMochila(node) {
    node.addEventListener('dragover', (e) => {
      if (!arrastando) return;
      const slot = SLOTS.find((s) => noEncaixe(personagem, s.id) === arrastando);
      // Guardar a mão principal não pode: o motor usa essa arma como ataque
      // padrão e ficar sem ela deixaria o personagem sem ataque nenhum.
      if (!slot || slot.id === 'maoPrincipal') { node.classList.add('recusa'); return; }
      node.classList.add('aceita');
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    node.addEventListener('dragleave', () => node.classList.remove('aceita', 'recusa'));
    node.addEventListener('drop', (e) => {
      e.preventDefault();
      node.classList.remove('aceita', 'recusa');
      const id = arrastando;
      arrastando = null;
      const slot = SLOTS.find((s) => noEncaixe(personagem, s.id) === id);
      if (slot && slot.id !== 'maoPrincipal') trocar(slot.id, slot.id === 'armadura' ? 'nenhuma' : null);
    });
    return node;
  }

  // ---- usar item ----------------------------------------------------------

  /**
   * Usar um consumível daqui de dentro.
   *
   * Quem executa é o ENCONTRO, via `onUsar`: a ficha não conhece economia de
   * ação, alcance nem alvo, e escrever uma segunda versão dessas regras aqui
   * seria a maneira mais rápida de a tela e o motor discordarem. A ficha só
   * mostra o motivo que vier de volta.
   */
  function usar(id) {
    const r = handlers.onUsar?.(personagem, id);
    if (!r) { aviso = 'não dá para usar item agora'; render(); return; }
    if (!r.ok) { aviso = r.why; render(); return; }
    aviso = null;
    render();
  }

  // ---- troca de equipamento -----------------------------------------------

  function trocar(slot, id) {
    const veto = handlers.podeEquipar?.(personagem, slot);
    if (veto) { aviso = veto; render(); return; }

    const r = equipar(personagem, slot, id);
    if (!r.ok) { aviso = r.why; render(); return; }

    // A ordem importa: a aparência sai do equipamento JÁ trocado.
    aplicarAparencia(personagem);
    aviso = avisoDeArmadura(personagem, personagem.armor);
    encaixeAberto = null;
    render();
    handlers.onEquipar?.(personagem, r);
  }

  // ---- pé -----------------------------------------------------------------

  function pe() {
    const carga = cargaDe(personagem);
    return el('div', { class: 'ficha-pe' },
      el('span', { class: 'ficha-aviso' }, aviso ?? ''),
      el('span', { class: 'ficha-carga' }, `Carga ${carga.peso} de ${carga.capacidade} lb · Esc fecha · Tab troca de aba`));
  }

  function render() {
    if (!personagem) return;
    janela.replaceChildren(
      cabeca(),
      el('div', { class: 'ficha-rolagem' }, aba === 'inventario' ? painelInventario() : painelFicha()),
      pe(),
    );
  }

  // ---- teclado ------------------------------------------------------------

  // Captura na janela, e não na fase de bolha: enquanto a ficha está aberta
  // ela toma o teclado inteiro. Sem isto o Esc chegaria também em `main.js`
  // (que cancelaria o modo de alvo por baixo do véu) e os dígitos 1–9
  // disparariam a hotbar de magias que o jogador nem está vendo.
  function aoTeclar(e) {
    if (!estaAberta()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    const k = e.key.toLowerCase();
    if (e.key === 'Escape' || k === 'c') { e.preventDefault(); fechar(); return; }
    // Tab alterna; C e I são as mesmas teclas que ABREM cada aba, então aqui
    // elas levam para a aba correspondente em vez de não fazer nada.
    if (e.key === 'Tab' || k === 'i') {
      e.preventDefault();
      aba = k === 'i' ? 'inventario' : (aba === 'ficha' ? 'inventario' : 'ficha');
      encaixeAberto = null;
      render();
    }
  }
  addEventListener('keydown', aoTeclar, { capture: true });

  // ---- API ----------------------------------------------------------------

  function abrir(novo, abaInicial = 'ficha') {
    if (!novo) return;
    personagem = garantirInventario(novo);
    aba = abaInicial === 'inventario' ? 'inventario' : 'ficha';
    encaixeAberto = null;
    aviso = avisoDeArmadura(personagem, personagem.armor);
    render();
    overlay.style.display = '';
  }

  function fechar() {
    if (!estaAberta()) return;
    overlay.style.display = 'none';
    encaixeAberto = null;
    handlers.onFechar?.();
  }

  return {
    abrir,
    fechar,
    estaAberta,
    /** Redesenha com o estado atual — para quando o combate mudar PV ou espaços. */
    atualizar() { if (estaAberta()) render(); },
    /** Quem está na janela agora, ou null. */
    personagem: () => personagem,
    destruir() {
      removeEventListener('keydown', aoTeclar, { capture: true });
      overlay.remove();
    },
  };
}
