// HUD: ordem de turno, trilho do grupo, barra de ações, log de rolagens.
// DOM puro. Nome de jogador e texto de log sempre via textContent.
//
// A ARQUITETURA
// Vem do Baldur's Gate 3, que é o mesmo jogo que este: 5e tático em turnos com
// um grupo de quatro. Vale copiar a arquitetura de informação dele porque ela
// já resolveu problemas que apareceriam aqui de qualquer jeito. A arte é nossa.
//
// A tela se divide em cinco regiões, e cada uma responde UMA pergunta:
//
//   ordem de turno (topo)    quem joga agora e quem vem depois
//   trilho do grupo (esq.)   como está cada um dos meus
//   tabuleiro (centro)       onde todo mundo está
//   log (direita)            o que acabou de acontecer e por quê
//   barra de ação (baixo)    o que EU posso fazer agora
//
// A barra de ação é dividida em zonas, e a divisão não é estética: cada zona é
// um recurso diferente do turno. Ataques e ações comuns gastam a AÇÃO; a
// hotbar gasta ação ou ação bônus conforme a magia; o medidor gasta MOVIMENTO;
// a reação é de fora do turno. O núcleo, no meio, mostra as gemas de ação e de
// bônus — é a resposta mais rápida para "o que ainda me resta".
//
// Antes disso tudo era uma fileira de botões de texto com emoji, e emoji é
// desenho do sistema operacional: era metade da cara de amador.

import { makePortrait } from '../art/sheet.js';
import { iconCanvas, iconeDeArma, iconeDeMagia } from '../art/icons.js';
import { CONDITIONS, hasCondition } from '../rules/conditions.js';
import { WEAPONS } from '../rules/equipment.js';
import { getSpell } from '../rules/spells.js';
import { spellSaveDc, spellAttackBonus } from '../rules/abilities.js';
import { formatModifier } from '../core/dice.js';
import { audio } from '../core/audio.js';

export const el = (tag, attrs = {}, ...children) => {
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

/**
 * `replaceChildren` não é como `el()`: ele converte `null` no TEXTO "null" e
 * imprime isso na tela. Todo lugar que monta filhos condicionais passa por
 * aqui antes.
 */
const limpos = (...filhos) => filhos.flat().filter((f) => f !== null && f !== undefined && f !== false);

const LOG_ICON = {
  inicio: '🎲', turno: '⏳', ataque: '⚔️', magia: '✨', cura: '💚', morte: '💀',
  condicao: '🌀', recurso: '🔸', acao: '🏃', reacao: '⚡', aviso: '⚠️',
  concentracao: '🧠', fim: '🏁',
};

export class Hud {
  constructor(root, handlers) {
    this.handlers = handlers;
    this.root = root;
    this.hotkeys = [];

    this.ordem = el('div', { class: 'ordem' });
    this.viewBar = el('div', { class: 'viewbar' });
    this.banner = el('div', { class: 'turn-banner' });
    this.trilho = el('div', { class: 'trilho' });
    this.logList = el('div', { class: 'log-list' });
    this.barra = el('div', { class: 'barra-acao' });
    this.hint = el('div', { class: 'hint' });
    this.dica = el('div', { class: 'dica', role: 'tooltip' });

    root.append(
      el('div', { class: 'hud-topo' }, this.banner, this.ordem, this.viewBar),
      el('div', { class: 'hud-meio' },
        el('aside', { class: 'coluna-grupo' }, this.trilho),
        el('div', { class: 'palco' },
          el('div', { class: 'board-wrap', id: 'board-wrap' }),
          this.hint),
        el('aside', { class: 'coluna-log' },
          el('h2', {}, 'Rolagens'),
          this.logList,
          el('footer', { class: 'legal' },
            el('p', {}, 'Phandalin é conteúdo de fã não oficial, permitido sob a Fan Content Policy da Wizards of the Coast. '
              + 'Não é aprovado nem endossado pela Wizards. Partes dos materiais usados são propriedade da Wizards of the Coast. '
              + '©Wizards of the Coast LLC.'),
            el('p', {}, 'Inclui material do SRD 5.1 por Wizards of the Coast LLC, sob licença Creative Commons Attribution 4.0.')))),
      el('div', { class: 'hud-baixo' }, this.barra),
      this.dica,
    );

    // As teclas 1–9 disparam a hotbar, como num jogo de verdade. Dígito não
    // conflita com nada que `main.js` já escuta (Esc, espaço, Tab, Q/E, M).
    addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const slot = this.hotkeys[n - 1];
      if (!slot || slot.disabled) return;
      e.preventDefault();
      slot.run();
    });
  }

  get boardWrap() {
    return this.root.querySelector('#board-wrap');
  }

  // ---- dica flutuante -------------------------------------------------------

  /**
   * O tooltip rico é o que transforma um ícone em informação. Sem ele o jogador
   * tem de decorar vinte desenhos; com ele, o desenho é só o atalho.
   */
  ligarDica(node, dados) {
    if (!dados) return node;
    const mostrar = () => {
      this.dica.replaceChildren(...limpos(
        el('div', { class: 'dica-topo' },
          el('strong', {}, dados.nome),
          dados.tipo ? el('span', { class: 'dica-tipo' }, dados.tipo) : null),
        dados.linhas?.length
          ? el('div', { class: 'dica-linhas' }, dados.linhas.filter(Boolean).map(
            ([rotulo, valor]) => el('div', { class: 'dica-linha' },
              el('span', { class: 'dica-rot' }, rotulo),
              el('span', { class: 'dica-val' }, valor))))
          : null,
        dados.texto ? el('p', { class: 'dica-texto' }, dados.texto) : null,
        dados.custo ? el('div', { class: 'dica-custo' }, dados.custo) : null,
        dados.aviso ? el('div', { class: 'dica-aviso' }, dados.aviso) : null,
      ));
      const r = node.getBoundingClientRect();
      // Medir ANTES de reposicionar dá a largura do lugar ANTERIOR: se a dica
      // estava encostada na borda, ela tinha quebrado mais estreita, e a trava
      // de borda calculada com esse número deixa a dica meio palmo fora da
      // tela. Zerar a posição primeiro força a medida no espaço livre.
      this.dica.style.left = '0px';
      this.dica.style.top = '0px';
      this.dica.classList.add('on');
      const dr = this.dica.getBoundingClientRect();
      const x = Math.min(Math.max(8, r.left + r.width / 2 - dr.width / 2), innerWidth - dr.width - 8);
      this.dica.style.left = `${x}px`;
      this.dica.style.top = `${Math.max(8, r.top - dr.height - 10)}px`;
    };
    const esconder = () => this.dica.classList.remove('on');
    node.addEventListener('pointerenter', mostrar);
    node.addEventListener('pointerleave', esconder);
    node.addEventListener('click', esconder);
    return node;
  }

  /** Um azulejo da barra: ícone, tecla, estado e dica. */
  tile(icone, { tecla = null, ativo = false, desabilitado = false, classe = '', dica = null, onClick = null }) {
    const node = el('button', {
      class: `tile${ativo ? ' on' : ''}${desabilitado ? ' off' : ''}${classe ? ` ${classe}` : ''}`,
      disabled: desabilitado ? 'disabled' : null,
      onclick: onClick ?? undefined,
    },
      iconCanvas(icone, 2),
      tecla ? el('span', { class: 'tecla' }, tecla) : null);
    return this.ligarDica(node, dica);
  }

  // ---- log e faixa ----------------------------------------------------------

  pushLog(entry) {
    const node = el('div', { class: `log-entry log-${entry.kind}` },
      el('span', { class: 'log-icon' }, LOG_ICON[entry.kind] ?? '•'),
      el('div', {},
        el('span', { class: 'log-text' }, entry.text),
        entry.detail ? el('span', { class: 'log-detail' }, entry.detail) : null));
    this.logList.append(node);
    this.logList.scrollTop = this.logList.scrollHeight;
    while (this.logList.childElementCount > 160) this.logList.firstElementChild.remove();
  }

  setBanner(enc) {
    if (enc.over) {
      this.banner.textContent = enc.outcome === 'vitoria' ? 'Vitória' : 'Derrota';
      this.banner.className = `turn-banner ${enc.outcome}`;
      return;
    }
    const party = enc.side === 'party';
    this.banner.textContent = party ? `Rodada ${enc.round} · seu turno` : `Rodada ${enc.round} · inimigos`;
    this.banner.className = `turn-banner ${party ? 'party' : 'foes'}`;
  }

  setHint(text) {
    this.hint.textContent = text ?? '';
  }

  update(enc, selected, mode) {
    this.setBanner(enc);
    this.renderOrdem(enc, selected);
    this.renderTrilho(enc, selected);
    this.renderBarra(enc, selected, mode);
    this.renderViewBar();
  }

  // ---- ordem de turno -------------------------------------------------------

  /**
   * Este jogo usa iniciativa POR LADO: um grupo inteiro age, depois o outro.
   * A fila mostra exatamente isso — quem ainda tem turno neste lado, e o lado
   * que espera, separado por uma marca. Fingir uma fila individual mostraria
   * uma ordem que a regra não tem.
   */
  renderOrdem(enc, selected) {
    if (enc.over) { this.ordem.replaceChildren(); return; }
    const agora = enc.side;
    const depois = agora === 'party' ? 'foes' : 'party';

    const ficha = (c, ativo) => {
      const down = c.dead || hasCondition(c, 'inconsciente');
      const pct = Math.max(0, c.hp / c.maxHp);
      const retrato = makePortrait(c.look, 32);
      retrato.className = 'pixel';
      const node = el('div', {
        class: `vez${ativo ? ' agora' : ''}${c.acted ? ' agiu' : ''}${down ? ' down' : ''}${selected === c ? ' alvo' : ''}`,
      },
        el('div', { class: 'vez-retrato' }, retrato),
        el('div', { class: 'vez-pv' }, el('i', { style: { width: `${pct * 100}%` } })));
      return this.ligarDica(node, {
        nome: c.name,
        tipo: c.kind === 'npc' ? 'inimigo' : `${c.className} · Nv ${c.level}`,
        linhas: [['Pontos de vida', `${Math.max(0, Math.ceil(c.hp))} / ${c.maxHp}`], ['Classe de armadura', String(c.ac)]],
        aviso: down ? 'Fora de combate' : c.acted ? 'Já agiu nesta rodada' : null,
      });
    };

    this.ordem.replaceChildren(
      ...enc.allOf(agora).map((c) => ficha(c, true)),
      el('span', { class: 'vez-sep', title: 'Iniciativa por lado: todo o lado age, depois passa' }, '▸'),
      ...enc.allOf(depois).map((c) => ficha(c, false)),
    );
  }

  // ---- trilho do grupo ------------------------------------------------------

  renderTrilho(enc, selected) {
    this.trilho.replaceChildren(...limpos(
      enc.allOf('party').map((c) => this.fichaGrupo(enc, c, selected)),
      enc.allOf('foes').length ? el('div', { class: 'trilho-titulo' }, 'Inimigos') : null,
      enc.allOf('foes').map((c) => this.fichaInimigo(c)),
    ));
  }

  fichaGrupo(enc, c, selected) {
    const down = c.dead || hasCondition(c, 'inconsciente');
    const pct = Math.max(0, c.hp / c.maxHp);
    const retrato = makePortrait(c.look, 44);
    retrato.className = 'pixel';

    const node = el('button', {
      class: `ficha${selected === c ? ' on' : ''}${c.acted ? ' agiu' : ''}${down ? ' down' : ''}`,
      onclick: () => this.handlers.onSelect?.(c),
    },
      el('div', { class: 'ficha-retrato' }, retrato, el('span', { class: 'ficha-ca' }, c.ac)),
      el('div', { class: 'ficha-corpo' },
        el('strong', {}, c.name),
        el('span', { class: 'ficha-sub' }, `${c.className} ${c.ancestry}`),
        el('div', { class: 'bar' },
          el('i', { style: { width: `${pct * 100}%`, background: pct > 0.5 ? '#5fd07a' : pct > 0.25 ? '#ffc83a' : '#ff5a5a' } })),
        el('span', { class: 'ficha-pv' }, `${Math.max(0, Math.ceil(c.hp))} / ${c.maxHp}`),
        down
          ? el('span', { class: 'ficha-morte' }, c.dead ? 'Morto' : `Morte ${c.deathSaves.successes}✓ ${c.deathSaves.failures}✗`)
          : null,
        c.spellcasting
          ? el('div', { class: 'slots' }, c.spellcasting.slots.map((n, lvl) => (lvl === 0 || n === undefined ? null
            : el('span', { class: 'slot' }, `${lvl}º ${'◆'.repeat(n)}`))))
          : null,
        (c.conditions ?? []).length
          ? el('div', { class: 'conds' }, c.conditions.map((x) => this.ligarDica(
            el('span', { class: 'cond' }, CONDITIONS[x.id]?.icon ?? '•'),
            { nome: CONDITIONS[x.id]?.name ?? x.id, texto: CONDITIONS[x.id]?.desc },
          )))
          : null),
    );
    return node;
  }

  fichaInimigo(c) {
    const pct = Math.max(0, c.hp / c.maxHp);
    const down = hasCondition(c, 'inconsciente');
    return this.ligarDica(
      el('div', { class: `inimigo${down ? ' down' : ''}` },
        el('div', { class: 'inimigo-topo' },
          el('strong', {}, c.name),
          el('span', { class: 'inimigo-ca' }, c.ac)),
        el('div', { class: 'bar small' }, el('i', { style: { width: `${pct * 100}%`, background: '#d4574a' } })),
        (c.conditions ?? []).length
          ? el('div', { class: 'conds' }, c.conditions.map((x) => el('span', { class: 'cond' }, CONDITIONS[x.id]?.icon ?? '•')))
          : null),
      {
        nome: c.name,
        tipo: c.blurb ? 'inimigo' : null,
        linhas: [['Classe de armadura', String(c.ac)], ['Pontos de vida', `${Math.max(0, Math.ceil(c.hp))} / ${c.maxHp}`]],
        texto: c.blurb,
      },
    );
  }

  // ---- barra de ação --------------------------------------------------------

  renderBarra(enc, c, mode) {
    this.hotkeys = [];
    this.barra.replaceChildren();

    if (enc.over) {
      this.barra.append(el('div', { class: 'barra-aviso' },
        el('button', { class: 'btn primary', onclick: () => this.handlers.onRestart?.() }, 'Novo encontro')));
      return;
    }
    if (enc.side !== 'party') {
      this.barra.append(el('div', { class: 'barra-aviso' }, 'Os inimigos estão agindo…'));
      return;
    }
    if (!c) {
      this.barra.append(el('div', { class: 'barra-aviso' }, 'Escolha um personagem à esquerda.'));
      return;
    }
    if (c.dead || hasCondition(c, 'inconsciente')) {
      this.barra.append(el('div', { class: 'barra-aviso' }, `${c.name} está fora de combate.`));
      return;
    }

    // A barra muda com a classe. O mago precisa de gestão de espaços de magia
    // e o guerreiro não tem nenhum: reservar a zona vazia para ele seria
    // mostrar um recurso que não existe.
    this.barra.append(...limpos(
      this.zonaAtaques(c, mode),
      this.zonaComuns(enc, c, mode),
      this.nucleo(c),
      this.zonaMovimento(c),
      this.zonaRecursos(c),
      c.spellcasting ? this.zonaHotbar(c, mode) : null,
      this.zonaReacao(c),
    ));
  }

  zonaAtaques(c, mode) {
    const tiles = (c.weapons ?? []).map((wid) => {
      const w = WEAPONS[wid];
      return this.tile(iconeDeArma(w.art, w.name), {
        ativo: mode?.kind === 'attack' && mode.weaponId === wid,
        desabilitado: c.actionUsed,
        onClick: () => this.handlers.onAction?.({ kind: 'attack', weaponId: wid }),
        dica: {
          nome: w.name,
          tipo: w.ranged ? 'ataque à distância' : 'ataque corpo a corpo',
          linhas: [
            ['Dano', `${w.damage} ${w.type}`],
            [w.ranged ? 'Alcance' : 'Alcance', w.ranged ? `${w.rangeFt} pés` : `${w.reachFt ?? 5} pés`],
          ],
          custo: 'Ação',
          aviso: c.actionUsed ? 'A ação deste turno já foi usada' : null,
        },
      });
    });
    return el('div', { class: 'zona zona-ataques' },
      el('div', { class: 'tiles' }, tiles),
      el('span', { class: 'zona-rot' }, 'Ataques'));
  }

  zonaComuns(enc, c, mode) {
    const tiles = [];
    const comum = (icone, nome, texto, custo, acao, desabilitado) => tiles.push(this.tile(icone, {
      desabilitado,
      onClick: () => this.handlers.onAction?.(acao),
      dica: { nome, texto, custo, aviso: desabilitado ? 'Indisponível agora' : null },
    }));

    comum('correr', 'Disparada', 'Dobra o deslocamento deste turno.', 'Ação', { kind: 'dash' }, c.actionUsed);
    comum('esquivar', 'Esquivar', 'Quem te ataca fica com desvantagem; seus testes de Destreza ganham vantagem.', 'Ação', { kind: 'dodge' }, c.actionUsed);
    comum('desengajar', 'Desengajar', 'Sair de perto sem sofrer ataque de oportunidade.', 'Ação', { kind: 'disengage' }, c.actionUsed);

    const feats = {
      secondWind: ['folego', 'Retomar o Fôlego', 'Recupera 1d10 + nível de pontos de vida.', 'Ação bônus', () => !c.bonusUsed && c.resources?.secondWind > 0],
      actionSurge: ['surto', 'Ação Surpreendente', 'Ganha uma ação extra neste turno.', 'Livre', () => c.resources?.actionSurge > 0],
      cunningAction: ['ardilosa', 'Ação Ardilosa', 'Disparada, Desengajar ou Esconder-se como ação bônus.', 'Ação bônus', () => !c.bonusUsed],
      preserveLife: ['preservar', 'Preservar a Vida', 'Distribui cura entre os feridos por perto.', 'Ação', () => !c.actionUsed && c.resources?.channelDivinity > 0],
    };
    for (const f of c.features ?? []) {
      const e = feats[f];
      if (!e) continue;
      comum(e[0], e[1], e[2], e[3], { kind: 'feature', featureId: f }, !e[4]());
    }

    const caido = enc.alliesOf(c).find(
      (a) => !a.dead && !a.stable && hasCondition(a, 'inconsciente')
        && Math.max(Math.abs(a.pos.x - c.pos.x), Math.abs(a.pos.y - c.pos.y)) === 1,
    );
    if (caido) {
      comum('estabilizar', `Estabilizar ${caido.name}`, 'Teste de Medicina CD 10. Impede a morte; não cura.', 'Ação',
        { kind: 'stabilize', targetId: caido.id }, c.actionUsed);
    }

    return el('div', { class: 'zona zona-comuns' },
      el('div', { class: 'tiles' }, tiles),
      el('span', { class: 'zona-rot' }, 'Ações'));
  }

  /**
   * O núcleo. As duas gemas são a informação mais consultada da tela inteira:
   * acesa é recurso disponível, apagada é gasto. O retrato no meio existe para
   * o jogador nunca precisar conferir de quem é o turno.
   */
  nucleo(c) {
    const retrato = makePortrait(c.look, 58);
    retrato.className = 'pixel';
    const pct = Math.max(0, c.hp / c.maxHp);

    // Ação Surpreendente dá uma ação EXTRA. Mostrar "1" quando restam duas é
    // esconder do guerreiro o recurso que define o turno dele.
    const acoesExtras = c.resources?.actionSurge ?? 0;
    const acoesRestam = (c.actionUsed ? 0 : 1) + acoesExtras;

    const gema = (icone, restam, nome, texto) => this.ligarDica(
      el('div', { class: `gema${restam ? '' : ' gasta'}` },
        iconCanvas(icone, 1),
        restam > 1 ? el('span', { class: 'gema-n' }, restam) : null),
      { nome, texto, aviso: restam ? `${restam} disponível${restam > 1 ? 'is' : ''}` : 'Já usada neste turno' },
    );

    return el('div', { class: 'nucleo' },
      el('div', { class: 'nucleo-retrato' },
        retrato,
        el('div', { class: 'nucleo-pv' },
          el('i', { style: { width: `${pct * 100}%`, background: pct > 0.5 ? '#5fd07a' : pct > 0.25 ? '#ffc83a' : '#ff5a5a' } }))),
      el('div', { class: 'nucleo-nome' }, c.name),
      el('div', { class: 'nucleo-vitais' },
        el('span', {}, `${Math.max(0, Math.ceil(c.hp))}/${c.maxHp} PV`),
        el('span', { class: 'nucleo-ca' }, `CA ${c.ac}`)),
      el('div', { class: 'gemas' },
        gema('acao', acoesRestam, 'Ação',
          acoesExtras
            ? 'Uma por turno — e Ação Surpreendente dá outra.'
            : 'Uma por turno: atacar, conjurar, disparada, esquivar, desengajar.'),
        gema('bonus', c.bonusUsed ? 0 : 1, 'Ação bônus', 'Uma por turno, e só quando alguma habilidade a oferece.')),
      el('button', {
        class: 'btn-terminar',
        onclick: () => this.handlers.onEndTurn?.(),
        title: 'Terminar o turno (espaço)',
      }, iconCanvas('terminar', 2), 'Terminar'));
  }

  /**
   * Os recursos que NÃO são da economia de turno: espaços de magia e cargas de
   * classe. Mudam com a classe porque a classe é isso — o mago gerencia
   * espaços, o guerreiro gerencia duas cargas e o ladino não gerencia nada.
   * Quem não tem nada a gerenciar não ganha a zona.
   */
  zonaRecursos(c) {
    const blocos = [];

    if (c.spellcasting) {
      const max = c.spellcasting.slotsMax ?? c.spellcasting.slots;
      const linhas = [];
      for (let lvl = 1; lvl < c.spellcasting.slots.length; lvl++) {
        const total = max[lvl] ?? 0;
        if (!total) continue;
        const tem = c.spellcasting.slots[lvl] ?? 0;
        linhas.push(this.ligarDica(
          el('div', { class: 'slot-linha' },
            el('span', { class: 'slot-lvl' }, `${lvl}º`),
            el('div', { class: 'pips' }, Array.from({ length: total }, (_, i) => el('span', { class: `pip${i < tem ? '' : ' gasto'}` })))),
          {
            nome: `Espaços de ${lvl}º círculo`,
            linhas: [['Restam', `${tem} de ${total}`]],
            texto: 'Gastos ao conjurar. Voltam num descanso longo.',
          },
        ));
      }
      if (linhas.length) blocos.push(el('div', { class: 'recurso-grupo' }, linhas));
    }

    const nomes = {
      secondWind: ['folego', 'Retomar o Fôlego'],
      actionSurge: ['surto', 'Ação Surpreendente'],
      channelDivinity: ['preservar', 'Canalizar Divindade'],
    };
    const linhasCarga = [];
    for (const [id, n] of Object.entries(c.resources ?? {})) {
      const total = c.resourcesMax?.[id] ?? n;
      if (!total) continue;
      const [icone, nome] = nomes[id] ?? ['acao', id];
      linhasCarga.push(this.ligarDica(
        el('div', { class: 'slot-linha' },
          iconCanvas(icone, 1),
          el('div', { class: 'pips' }, Array.from({ length: total }, (_, i) => el('span', { class: `pip${i < n ? '' : ' gasto'}` })))),
        { nome, linhas: [['Restam', `${n} de ${total}`]], texto: 'Volta num descanso.' },
      ));
    }
    if (linhasCarga.length) blocos.push(el('div', { class: 'recurso-grupo' }, linhasCarga));

    if (!blocos.length) return null;
    return el('div', { class: 'zona zona-recursos' },
      el('div', { class: 'recursos' }, blocos),
      el('span', { class: 'zona-rot' }, 'Recursos'));
  }

  zonaMovimento(c) {
    const total = c.speedFt || 30;
    const resta = Math.max(0, c.movementLeftFt ?? 0);
    const pct = Math.min(1, resta / total);
    // Marcas de 1,5 m (um quadrado) para o jogador contar quadrados, não pés.
    const quadrados = Math.max(1, Math.round(total / 5));
    const node = el('div', { class: 'zona zona-mov' },
      el('div', { class: 'mov' },
        el('div', { class: 'mov-trilho' },
          el('i', { class: 'mov-cheio', style: { width: `${pct * 100}%` } }),
          ...Array.from({ length: quadrados - 1 }, (_, i) => el('span', {
            class: 'mov-marca', style: { left: `${((i + 1) / quadrados) * 100}%` },
          }))),
        el('div', { class: 'mov-num' }, iconCanvas('movimento', 1), `${resta} pés`)),
      el('span', { class: 'zona-rot' }, 'Movimento'));
    return this.ligarDica(node, {
      nome: 'Deslocamento',
      linhas: [['Resta', `${resta} pés · ${Math.floor(resta / 5)} quadrados`], ['Total por turno', `${total} pés`]],
      texto: 'Clique num quadrado azul para andar. Mover não gasta a ação.',
    });
  }

  zonaHotbar(c, mode) {
    const grupos = new Map();
    {
      const dc = spellSaveDc(c);
      const atk = spellAttackBonus(c);
      const todas = [...c.spellcasting.cantrips, ...c.spellcasting.prepared];
      for (const sid of todas) {
        const s = getSpell(sid);
        const semSlot = s.level > 0 && !c.spellcasting.slots[s.level];
        const bonus = s.castTime === 'bonus';
        const gasto = bonus ? c.bonusUsed : c.actionUsed;
        const desabilitado = semSlot || gasto;
        const n = this.hotkeys.length + 1;
        const run = () => this.handlers.onAction?.({ kind: 'spell', spellId: sid });
        if (n <= 9) this.hotkeys.push({ run, disabled: desabilitado });
        if (!grupos.has(s.level)) grupos.set(s.level, []);
        grupos.get(s.level).push(this.tile(iconeDeMagia({ ...s, id: sid }), {
          tecla: n <= 9 ? String(n) : null,
          ativo: mode?.kind === 'spell' && mode.spellId === sid,
          desabilitado,
          classe: s.level === 0 ? 'truque' : 'magia',
          onClick: run,
          dica: {
            nome: s.name,
            tipo: s.level === 0 ? 'truque' : `magia de ${s.level}º círculo`,
            linhas: [
              s.damage ? ['Dano', `${s.damage}${s.damageType ? ` ${s.damageType}` : ''}`] : null,
              s.rangeFt ? ['Alcance', `${s.rangeFt} pés`] : null,
              s.kind === 'attack' ? ['Ataque de magia', formatModifier(atk)] : null,
              s.save ? ['Resistência', `${s.save} CD ${dc}`] : null,
            ],
            texto: s.desc,
            custo: bonus ? 'Ação bônus' : 'Ação',
            aviso: semSlot ? `Sem espaço de ${s.level}º círculo` : gasto ? 'Recurso do turno já usado' : null,
          },
        }));
      }
    }
    // Agrupado por círculo, com o truque primeiro: é assim que o jogador
    // pensa a mão dele — o que é de graça e o que custa um espaço.
    const colunas = [...grupos.entries()].sort((a, b) => a[0] - b[0]).map(([lvl, tiles]) => {
      const max = c.spellcasting.slotsMax?.[lvl] ?? 0;
      const tem = c.spellcasting.slots?.[lvl] ?? 0;
      return el('div', { class: 'grupo-magia' },
        el('div', { class: 'tiles' }, tiles),
        el('span', { class: 'grupo-rot' },
          lvl === 0 ? 'truques' : `${lvl}º`,
          lvl > 0 && max ? el('span', { class: 'grupo-slots' }, ` ${tem}/${max}`) : null));
    });

    return el('div', { class: 'zona zona-hotbar' },
      el('div', { class: 'grupos-magia' }, colunas),
      el('span', { class: 'zona-rot' }, 'Magias'));
  }

  /**
   * A reação é o único recurso que o jogador gasta FORA do próprio turno, e é
   * por isso que ela fica separada no canto: o ataque de oportunidade acontece
   * sozinho quando um inimigo sai de perto, e o jogador precisa saber se ainda
   * tem essa carta antes de deixar o inimigo passar.
   */
  zonaReacao(c) {
    const gasta = !!c.reactionUsed;
    const node = el('div', { class: `reacao${gasta ? ' gasta' : ''}` }, iconCanvas('reacao', 2));
    return el('div', { class: 'zona zona-reacao' },
      this.ligarDica(node, {
        nome: 'Reação',
        tipo: 'fora do seu turno',
        texto: 'Ataque de oportunidade: quando um inimigo adjacente se afasta, você ataca de graça. Uma por rodada.',
        aviso: gasta ? 'Já usada nesta rodada' : 'Disponível',
      }),
      el('span', { class: 'zona-rot' }, 'Reação'));
  }

  // ---- câmera e som ---------------------------------------------------------

  renderViewBar() {
    if (this.viewBar.childElementCount > 0) {
      this.muteBtn.replaceChildren(audio.muted ? '🔇' : '🔊');
      this.volume.value = String(audio.muted ? 0 : Math.round(audio.volume * 100));
      return;
    }

    this.muteBtn = el('button', {
      class: 'icon-btn',
      title: 'Ligar/desligar som (M)',
      onclick: () => { audio.unlock(); audio.toggleMute(); this.renderViewBar(); },
    }, audio.muted ? '🔇' : '🔊');

    this.volume = el('input', {
      type: 'range', min: '0', max: '100', class: 'volume',
      value: String(Math.round(audio.volume * 100)),
      title: 'Volume',
      oninput: (e) => { audio.unlock(); audio.setVolume(Number(e.target.value) / 100); this.renderViewBar(); },
    });

    this.viewBar.replaceChildren(
      el('button', { class: 'icon-btn', title: 'Girar a câmera (Q)', onclick: () => this.handlers.onRotate?.(-1) }, '↺'),
      el('button', { class: 'icon-btn', title: 'Girar a câmera (E)', onclick: () => this.handlers.onRotate?.(1) }, '↻'),
      el('span', { class: 'divider' }),
      el('button', { class: 'icon-btn', title: 'Afastar (roda do mouse)', onclick: () => this.handlers.onZoom?.(1 / 1.2) }, '－'),
      el('button', { class: 'icon-btn', title: 'Enquadrar de novo', onclick: () => this.handlers.onResetCamera?.() }, '⌖'),
      el('button', { class: 'icon-btn', title: 'Aproximar (roda do mouse)', onclick: () => this.handlers.onZoom?.(1.2) }, '＋'),
      el('span', { class: 'divider' }),
      this.muteBtn,
      this.volume,
    );
  }
}
