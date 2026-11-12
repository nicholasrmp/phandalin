// A FICHA DA CRIATURA: o inimigo (e a criatura aliada, a invocação) com a figura inteira à esquerda e, à direita, o que
// se vê e o que se sabe dela.
//
// A FIGURA: a ilustração do livro, de corpo inteiro (`public/criaturas/`, `src/dev/baixar-arte-criaturas.py`). É arte
// da Wizards, como os mapas oficiais: fica só no disco de quem a baixou. Sem ela (ou sem ilustração no livro — o MM não
// desenha o bandido, o guarda nem a maior parte dos animais), a ficha mostra o token grande, e sem token o retrato.
//
// O QUE SE VÊ E O QUE SE SABE. O menu do botão direito já decidiu a regra, e a ficha a segue: do inimigo se vê a CA e
// como a ferida PARECE (ileso, arranhado, ferido, muito ferido), não o número. O resto — PV, atributos, ataques, nível de
// ameaça, resistências, sentidos, traços e o que se conta dela — é do LEMBRAR (`game/investigar.js`): alguém do grupo
// passa no teste uma vez, e o bloco fica conhecido na campanha (`campanha.bestiario`), para todas as criaturas dele. A
// ARENA de testes mostra tudo, porque ela existe para testar regra; a criatura aliada também, porque é do grupo.

import './ficha-criatura.css';
import { arteInteiraDe, fichaDe } from '../art/fichas-de-criatura.js';
import { makePortrait } from '../art/sheet.js';
import { iconCanvas, temIcone } from '../art/icons.js';
import { CONDITIONS, maxHpEfetivo } from '../rules/conditions.js';
import { ABILITIES, abilityMod, passivePerception } from '../rules/abilities.js';
import { getSpell } from '../rules/spells.js';
import { formatModifier } from '../core/dice.js';
import { saberDaCriatura, criaturaConhecida, opcaoDeLembrarCriatura, ndDe } from '../game/investigar.js';
import { estadoAparente } from '../game/interacoes.js';

const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
  return n;
};

const SIGLA = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };
const ND_TEXTO = { 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' };
const TAMANHO = { 'miúdo': 'Miúdo', 'pequeno': 'Pequeno', 'médio': 'Médio', 'grande': 'Grande', 'enorme': 'Enorme', 'imenso': 'Imenso' };
const MODOS = { flyFt: 'voo', swimFt: 'natação', climbFt: 'escalada', burrowFt: 'escavação' };
// a cor da barra de quem não se sabe a vida: só o degrau, como no menu
const DEGRAU = { ileso: 1, arranhado: 0.8, ferido: 0.5, 'muito ferido': 0.2, 'caído, inconsciente': 0, morto: 0 };

const maiuscula = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function deslocamentos(m) {
  const partes = [`${m.speedFt ?? 30} pés`];
  if (m.flyFt) partes.push(`${m.flyFt} de voo${m.hover ? ' (paira)' : ''}`);
  for (const [k, nome] of Object.entries(MODOS)) {
    if (k === 'flyFt') continue;
    const v = m.speeds?.[k];
    if (v) partes.push(`${v} de ${nome}`);
  }
  return partes.join(' · ');
}

/** A linha de um ataque do bloco: "+4 · 1d6+2 cortante · 5 pés". */
function linhaDeAtaque(a) {
  const alcance = a.ranged ? `${a.rangeFt}${a.longRangeFt ? `/${a.longRangeFt}` : ''} pés` : `${a.reachFt ?? 5} pés`;
  return [a.bonus != null ? formatModifier(a.bonus) : null, a.damage ? `${a.damage}${a.type ? ` ${a.type}` : ''}` : null, alcance]
    .filter(Boolean).join(' · ');
}

export function criarFichaDaCriatura(app, root) {
  let m = null;
  const janela = el('div', { class: 'criatura-janela', role: 'dialog', 'aria-modal': 'true' });
  const overlay = el('div', { class: 'criatura-overlay' }, janela);
  overlay.style.display = 'none';
  overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) fechar(); });
  root.append(overlay);
  const aberta = () => overlay.style.display !== 'none';

  // ---- a figura ----------------------------------------------------------
  function palco() {
    const caixa = el('div', { class: 'criatura-palco' });
    const token = fichaDe(m);
    const semArte = () => {
      caixa.classList.add('sem-arte');
      const no = token ? el('img', { class: 'criatura-token', src: token, alt: m.name }) : makePortrait(m.look ?? m.defId, 200);
      no.classList?.add('criatura-token');
      // sem nota: "o livro não a ilustra" mentiria para a criatura cuja arte só não foi baixada nesta máquina
      caixa.replaceChildren(no);
    };
    const arte = arteInteiraDe(m);
    if (!arte) { semArte(); return caixa; }
    const img = el('img', { class: 'criatura-arte', src: arte, alt: m.name, draggable: 'false' });
    img.addEventListener('error', semArte, { once: true });
    // A ilustração recortada (fundo transparente) pisa no chão do palco; a CENA pintada (17 das 391: o Venomfang com o
    // anão nas ruínas, os drows, os miconídeos) é um quadro, e vai emoldurada no meio. Quem decide são os quatro cantos.
    img.addEventListener('load', () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const w = cv.width - 2, h = cv.height - 2;
        const opaca = [[1, 1], [w, 1], [1, h], [w, h]].every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] > 250);
        caixa.classList.toggle('cena', opaca);
      } catch { /* sem leitura de pixel: fica como figura */ }
    }, { once: true });
    caixa.append(img);
    return caixa;
  }

  // ---- o que se vê -------------------------------------------------------
  function estado(sabe) {
    const aparente = m.dead ? 'morto' : estadoAparente(m);
    const max = maxHpEfetivo(m);
    const fracao = sabe ? Math.max(0, m.hp) / max : (DEGRAU[aparente] ?? 1);
    const cor = fracao > 0.66 ? 'var(--cf-verde)' : fracao > 0.33 ? 'var(--cf-ambar)' : 'var(--cf-vermelho)';
    return el('div', { class: 'criatura-estado' },
      el('div', { class: 'criatura-vida' },
        el('div', { class: 'criatura-barra' }, el('i', { style: { width: `${Math.round(fracao * 100)}%`, background: cor } })),
        el('span', { class: 'criatura-vida-txt' }, sabe
          ? `${Math.max(0, Math.ceil(m.hp))} / ${max} PV${m.tempHp ? ` +${m.tempHp}` : ''}`
          : maiuscula(aparente))),
      el('div', { class: 'criatura-ca', title: 'Classe de armadura' }, el('span', {}, 'CA'), el('strong', {}, String(m.ac))));
  }

  function condicoes() {
    const lista = m.conditions ?? [];
    if (!lista.length) return null;
    return el('div', { class: 'criatura-conds' }, [...new Map(lista.map((x) => [x.id, x])).values()].map((x) => {
      const def = CONDITIONS[x.id];
      const nome = def?.name ?? x.id;
      return el('span', { class: 'criatura-cond', title: def?.desc ?? nome },
        temIcone(x.id) ? iconCanvas(x.id, 20) : null, nome);
    }));
  }

  const numero = (rot, val, nota) => el('div', { class: 'criatura-num' },
    el('span', { class: 'criatura-num-rot' }, rot), el('strong', {}, val), nota ? el('small', {}, nota) : null);

  // ---- o que se sabe -----------------------------------------------------
  function blocoAtributos() {
    if (!m.abilities) return null;
    return el('section', { class: 'criatura-bloco' },
      el('h3', {}, 'Atributos'),
      el('div', { class: 'criatura-atributos' }, ABILITIES.map((a) => el('div', { class: 'criatura-atr' },
        el('span', {}, SIGLA[a]), el('strong', {}, String(m.abilities[a] ?? 10)),
        el('small', {}, formatModifier(abilityMod(m.abilities[a] ?? 10)))))));
  }

  function blocoAtaques() {
    const ataques = m.attacks ?? [];
    const sc = m.spellcasting;
    if (!ataques.length && !sc) return null;
    const linhas = ataques.map((a) => el('div', { class: 'criatura-ataque' },
      el('strong', {}, a.name), el('span', {}, linhaDeAtaque(a))));
    const multi = m.multiattack;
    const nomeMagia = (id) => getSpell(id)?.name ?? id;
    return el('section', { class: 'criatura-bloco' },
      el('h3', {}, 'Ações'),
      multi ? el('p', { class: 'criatura-multi' },
        `Ataques múltiplos: ${multi.sequence?.length ? multi.sequence.join(', ') : `${multi.count} ataques`}.`) : null,
      ...linhas,
      sc?.cantrips?.length ? el('p', { class: 'criatura-magias' }, el('strong', {}, 'Truques: '), sc.cantrips.map(nomeMagia).join(', ')) : null,
      sc?.prepared?.length ? el('p', { class: 'criatura-magias' }, el('strong', {}, 'Magias: '), sc.prepared.map(nomeMagia).join(', ')) : null);
  }

  function blocoSaber() {
    const [primeira, ...resto] = saberDaCriatura(m);
    return el('section', { class: 'criatura-bloco' },
      el('h3', {}, 'O que se sabe'),
      el('p', { class: 'criatura-saber-tipo' }, primeira),
      el('ul', { class: 'criatura-saber' }, resto.map((l) => el('li', {}, l))));
  }

  /** Ninguém lembrou dela ainda: o convite ao Lembrar, com quem rolaria. */
  function blocoDesconhecido() {
    const grupo = (app.enc?.combatants ?? []).filter((c) => c.side === 'party' && c.kind === 'pc' && !c.dead);
    // quem rola: o selecionado; se ele já tentou (ou está longe), o primeiro do grupo que ainda pode
    const fora = !app.enc?.side || app.root.classList.contains('explorando');
    const ordem = [...(grupo.includes(app.selected) ? [app.selected] : []), ...grupo.filter((c) => c !== app.selected)];
    const opcoes = m.dead ? [] : ordem.map((c) => [c, opcaoDeLembrarCriatura(app, c, m, { fora })]).filter(([, o]) => o);
    const [quem, op] = opcoes.find(([, o]) => !o.motivo) ?? opcoes[0] ?? [null, null];
    return el('section', { class: 'criatura-bloco criatura-desconhecida' },
      el('h3', {}, 'O que se sabe'),
      el('p', {}, 'Ninguém do grupo lembrou de nada sobre esta criatura. O teste de Lembrar diz o nível de ameaça, a vida, ',
        'os ataques, o que ela aguenta e o que sente.'),
      op ? el('button', {
        class: 'criatura-lembrar', disabled: Boolean(op.motivo), title: op.motivo ?? '',
        onclick: async () => { await op.fazer(); if (aberta()) render(); },
      }, `${quem.name}: Lembrar o que se sabe`, el('small', {}, op.motivo ?? op.detalhe)) : null);
  }

  // ---- montagem ----------------------------------------------------------
  function render() {
    const arena = app.config?.modo === 'arena';
    const doGrupo = m.side === 'party';
    const sabe = arena || doGrupo || criaturaConhecida(app, m);
    const nd = ndDe(m.xp);
    const pegada = m.pos?.f ?? 1;
    const tipo = [TAMANHO[m.size] ?? maiuscula(m.size), m.tipo].filter(Boolean).join(' · ');
    const lado = m.dead ? 'morto' : doGrupo ? 'aliado' : m.side === 'neutro' ? 'neutro' : 'inimigo';

    janela.replaceChildren(
      palco(),
      el('div', { class: 'criatura-corpo' },
        el('header', { class: 'criatura-cabeca' },
          el('div', {},
            el('h2', {}, m.name),
            el('p', { class: 'criatura-tipo' }, tipo, el('span', { class: `criatura-lado ${lado}` }, lado),
              sabe && m.xp != null ? el('span', { class: 'criatura-nd' }, `ND ${ND_TEXTO[nd] ?? nd} · ${m.xp} XP`) : null)),
          el('button', { class: 'criatura-fechar', title: 'Fechar (Esc)', onclick: fechar }, '×')),
        estado(sabe),
        condicoes(),
        m.blurb ? el('p', { class: 'criatura-blurb' }, m.blurb) : null,
        el('div', { class: 'criatura-nums' },
          numero('Deslocamento', deslocamentos(m)),
          numero('Tamanho', `${pegada}×${pegada}`, pegada === 1 ? 'casa' : 'casas'),
          sabe && m.abilities ? numero('Percepção', String(passivePerception(m)), 'passiva') : null),
        sabe ? blocoAtributos() : null,
        sabe ? blocoAtaques() : null,
        sabe ? blocoSaber() : blocoDesconhecido(),
        arena && !doGrupo ? el('p', { class: 'criatura-rodape' }, 'Arena de testes: a ficha mostra tudo. Na campanha, só o que o grupo lembrar.') : null));
  }

  function aoTeclar(e) {
    if (!aberta()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); }
  }
  addEventListener('keydown', aoTeclar, { capture: true });

  function abrir(criatura) {
    if (!criatura) return;
    m = criatura;
    render();
    overlay.style.display = '';
  }
  function fechar() {
    if (!aberta()) return;
    overlay.style.display = 'none';
    m = null;
  }
  return { abrir, fechar, estaAberta: aberta, atualizar() { if (aberta()) render(); }, criatura: () => m };
}
