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
// Vem das telas de personagem e de inventário de Baldur's Gate 3, pelo mesmo
// motivo que o HUD: é o mesmo jogo, e aquela arquitetura de informação já
// resolveu problemas que apareceriam aqui de qualquer jeito. Duas colunas, os
// encaixes do que está vestido em volta, mochila em grade, e os derivados
// sempre visíveis. A arte é nossa.

import './ficha.css';

import { makePortrait } from '../art/sheet.js';
import { LOOKS } from '../art/looks.js';
import { iconCanvas, iconeDeArma, iconeDeMagia, temIcone } from '../art/icons.js';
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
function iconeDeItem(id, escala = 2) {
  const achado = itemDeId(id);
  if (!achado) return el('span', { class: 'sigla' }, '—');
  const { tipo, dados } = achado;
  const nome = tipo === 'arma' ? iconeDeArma(dados.art, dados.name) : dados.art;
  if (nome && temIcone(nome)) return iconCanvas(nome, escala);
  return el('span', { class: 'sigla' }, sigla(dados.name));
}

/**
 * Põe no boneco o que está nos encaixes.
 *
 * A folha de sprites de `art/sheet.js` é cacheada POR CHAVE DE LOOK. Reescrever
 * o look no lugar não mudaria nada na tela: a folha velha continuaria em cache.
 * Então cada combinação de armadura, arma e escudo ganha a sua própria chave,
 * registrada no mesmo registro que o pintor consulta.
 */
function aplicarAparencia(personagem) {
  const base = (personagem.lookBase ??= personagem.look);
  const look = LOOKS[base];
  if (!look) return;
  const ap = aparenciaDe(personagem);

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
 *   podeEquipar?: (personagem: object) => string|null,
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
    }, temIcone(icone) ? iconCanvas(icone, 1) : null, texto);

    return el('div', { class: 'ficha-cabeca' },
      el('div', { class: 'ficha-cabeca-retrato' }, retrato),
      el('div', {},
        el('div', { class: 'ficha-nome' }, personagem.name),
        el('div', { class: 'ficha-linhagem' },
          `${personagem.className} ${personagem.ancestry} · nível ${personagem.level}`)),
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
    const pv = Math.max(0, Math.ceil(personagem.hp ?? personagem.maxHp));
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
        numero('PV', `${pv}/${personagem.maxHp}`, personagem.tempHp ? `+${personagem.tempHp} temporários` : null),
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
      return el('div', { class: 'talento' },
        el('div', { class: 'talento-nome' }, t[0]),
        el('p', { class: 'talento-texto' }, t[1] + extra));
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
          iconCanvas(iconeDeMagia({ ...s, id: sid }), 1),
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
          custo: s.castTime === 'bonus' ? 'Ação bônus' : 'Ação',
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
      el('div', { class: 'sub-rot' }, 'Truques'),
      el('div', { class: 'chips' }, (sc.cantrips ?? []).map(chip)),
      el('div', { class: 'sub-rot' }, 'Magias preparadas'),
      el('div', { class: 'chips' }, (sc.prepared ?? []).map(chip)));
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
      if (dados.efeito) linhas.push(['Efeito', dados.efeito]);
      if (dados.usos) linhas.push(['Usos', String(dados.usos)]);
      if (dados.peso) linhas.push(['Peso', `${dados.peso} lb`]);
    }
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

  function blocoEncaixes() {
    const linhas = SLOTS.map((slot) => {
      const id = noEncaixe(personagem, slot.id);
      const vazio = !id || id === 'nenhuma';
      const node = el('button', {
        class: `encaixe${vazio ? ' vazio' : ''}${encaixeAberto === slot.id ? ' on' : ''}`,
        onclick: () => { encaixeAberto = encaixeAberto === slot.id ? null : slot.id; render(); },
      },
        el('div', { class: 'encaixe-soquete' }, vazio && slot.id !== 'armadura' ? el('span', { class: 'sigla' }, '·') : iconeDeItem(id)),
        el('div', { class: 'encaixe-corpo' },
          el('span', { class: 'encaixe-rot' }, slot.name),
          el('span', { class: 'encaixe-nome' }, vazio && slot.id !== 'armadura' ? 'vazio' : nomeDeId(id)),
          el('span', { class: 'encaixe-dado' }, vazio && slot.id !== 'armadura' ? '—' : oQueDa(id))));
      return comDica(node, {
        nome: slot.name,
        tipo: vazio && slot.id !== 'armadura' ? 'encaixe vazio' : nomeDeId(id),
        texto: 'Clique para ver o que cabe aqui.',
      });
    });

    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Equipado'),
      el('div', { class: 'encaixes' }, linhas),
      encaixeAberto ? trocador(encaixeAberto) : null);
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
          vazio && id !== 'nenhuma' ? el('span', { class: 'sigla' }, '·') : iconeDeItem(id, 1),
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

  function blocoMochila() {
    const conteudo = conteudoDaMochila(personagem);
    const celulas = conteudo.map((e) => {
      const slot = encaixeNatural(e.id);
      const node = el('button', {
        class: `celula${slot ? ' equipavel' : ''}`,
        onclick: () => {
          if (!slot) { aviso = `${nomeDeId(e.id)} não vai em encaixe nenhum — é item de mochila.`; render(); return; }
          trocar(slot, e.id);
        },
      },
        iconeDeItem(e.id),
        el('span', { class: 'celula-nome' }, nomeDeId(e.id)),
        e.qtd > 1 ? el('span', { class: 'celula-qtd' }, e.qtd) : null);
      const dados = dicaDeItem(e.id);
      return comDica(node, { ...dados, aviso: slot ? 'Clique para equipar' : null });
    });

    return el('section', { class: 'bloco' },
      el('h3', { class: 'bloco-tit' }, 'Mochila'),
      celulas.length
        ? el('div', { class: 'mochila' }, celulas)
        : el('div', { class: 'mochila-vazia' }, 'Mochila vazia.'));
  }

  function painelInventario() {
    return el('div', { class: 'inv' }, blocoEncaixes(), blocoMochila());
  }

  // ---- troca de equipamento -----------------------------------------------

  function trocar(slot, id) {
    const veto = handlers.podeEquipar?.(personagem);
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
