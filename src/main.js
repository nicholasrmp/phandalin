import './style.css';
import './view/layout.css';

import { makeRng, seedFromString } from './core/rng.js';
import { Battlefield, key, distanceFt } from './core/grid.js';
import { Encounter } from './rules/combat.js';
import { makeParty } from './rules/party.js';
import { makeMonster } from './rules/monsters.js';
import { runMonsterSide, runAutoSummons, encerrarTurnoComInvocados } from './rules/ai.js';
import { hasCondition, conditionEffects } from './rules/conditions.js';
import { getSpell, opcoesDaMagia } from './rules/spells.js';
import { WEAPONS } from './rules/equipment.js';
import { mapaDo, buildFoes, reinforcementsFor } from './game/encounter.js';
import { montarHeroi } from './game/criacao.js';
import { criarCapitulo1 } from './game/capitulo1.js';
import { criarCenaCaverna } from './game/cena-caverna.js';
import { criarCapitulo2 } from './game/capitulo2.js';
import { criarRuaMarcarrubra } from './game/capitulo3-rua.js';
import { criarMansao } from './game/capitulo3-mansao.js';
import { criarEstrada } from './game/capitulo4-estrada.js';
import { criarPoco } from './game/capitulo4-poco.js';
import { criarCume } from './game/capitulo4-cume.js';
import { criarCastelo } from './game/capitulo4-castelo.js';
import { abrirRegiao } from './game/regiao.js';
import { abrirPhandalin } from './game/phandalin.js';
import { narrar, narrativaAberta } from './view/narrativa.js';
import { abrirMenuContexto, fecharMenuContexto } from './view/menu-contexto.js';
import { opcoesDaCasa } from './game/interacoes.js';
import { conversar as conversarComArvore } from './game/dialogo.js';
import { temEscuridaoEm, visaoDoGrupo } from './rules/luz.js';
import { descansoCurto, descansoLongoDoGrupo } from './view/descanso-tela.js';
import { UTIL_FORA, estadoDe as estadoDeUtilidade, avancar as avancarTempo, ativasDoGrupo, alarmeCobre } from './rules/utilidade.js';
import { entrarNoEncontro as familiarEntra, sairDoEncontro as familiarSai } from './rules/familiar.js';
import { escolherEConjurar, conjurarComTela, esperar as esperarTempo, auras as aurasDoDetectarMagia, marcasDoJogo } from './game/magias-fora.js';
import { Board } from './view/board.js';
import { Hud } from './view/hud.js';
import { criarFicha, aplicarAparencia } from './view/ficha.js';
import { criarMenu } from './view/menu.js';
import { audio } from './core/audio.js';
import {
  playWeaponVisual, playSpellVisual, playDeathVisual, andarDe,
  playGlifoVisual, playCordaoVisual, playAnuladaVisual,
} from './view/visuals.js';


class App {
  constructor(root) {
    this.root = root;
    this.hud = new Hud(root, {
      onSelect: (c) => this.select(c),
      onAction: (a) => this.chooseAction(a),
      onEndTurn: () => this.endTurn(),
      // Invocados: "Controlar" x "Agir sozinho", por criatura ou para todas de um dono.
      onAutoInvocado: (c) => this.alternarAuto(c),
      onAutoDosInvocados: (dono) => this.alternarAutoDoDono(dono),
      onRestart: () => this.newEncounter(),
      onZoom: (f) => { this.board?.zoomBy(f); audio.play('click'); },
      onResetCamera: () => { this.board?.resetCamera(); audio.play('click'); this.refresh(); },
      onAbrirFicha: (c) => this.ficha?.abrir(c, 'ficha'),
      // Explorando, as magias de utilidade saem pelo relógio, não pela rodada.
      explorando: () => Boolean(this.capitulo?.explorando),
      // Mesma porta do hover do tabuleiro: um só caminho para "quem é o alvo
      // em consideração", para os dois nunca discordarem.
      onAlvoHover: (alvo) => this.definirAlvo(alvo),
    });

    // A ficha pendura o próprio véu em `root` e cuida do teclado dela enquanto
    // está aberta. O que ela não faz é se abrir sozinha nem saber as regras do
    // encontro — isso é daqui.
    this.ficha = criarFicha(root, {
      // Reaproveita a dica rica do HUD; sem isto a ficha cai no `title` do navegador.
      dica: (node, dados) => this.hud.ligarDica(node, dados),
      // Trocar de armadura no meio da briga não pode ser de graça. Fora do
      // turno do grupo, nem isso.
      // Fora de combate (na vila), troca-se à vontade.
      // Em combate, o Livro do Jogador cobra: sacar ou guardar arma é a
      // interação gratuita do turno (a segunda gasta a ação), o escudo gasta a
      // ação e armadura leva minutos.
      podeEquipar: (p, slot) => {
        const enc = this.enc;
        if (!enc || enc.over || this.capitulo?.explorando) return null;
        if (enc.side !== 'party') return 'dá para trocar equipamento só no turno do grupo';
        if (p.hp <= 0 || conditionEffects(p).incapacitated) return 'incapacitado não troca de arma';
        if (slot === 'armadura') return 'vestir ou tirar armadura leva minutos: só fora do combate';
        if (slot === 'escudo') return p.actionUsed ? 'pôr ou tirar o escudo gasta a ação, e ela já foi usada' : null;
        return enc.custoDeInteracao(p) ? null : 'a interação gratuita e a ação deste turno já foram usadas';
      },
      onEquipar: (p, troca) => {
        const enc = this.enc;
        if (enc && !enc.over && !this.capitulo?.explorando) {
          enc.cobrarInteracao(p, troca.slot === 'escudo' ? 'acao' : enc.custoDeInteracao(p));
        }
        this.hud.pushLog({
          kind: 'recurso',
          text: `${p.name} trocou ${troca.slot}: CA ${troca.acAntes} → ${troca.acDepois}`,
          detail: troca.semTreino ? 'sem treino nessa armadura — desvantagem e nada de conjurar' : null,
          round: this.enc?.round ?? 1,
        });
        audio.play('click');
        this.refresh();
      },
      // Beber a poção pela ficha é a MESMA ação de bebê-la pela barra: passa
      // pelo motor, gasta a ação do turno e entra no log. Uma segunda porta
      // que curasse sem cobrar nada seria um jeito de o jogador curar de
      // graça só por ter a janela aberta.
      onUsar: (p, id) => {
        if (this.enc?.side !== 'party' || this.enc.over) {
          return { ok: false, why: 'dá para usar item só no turno do grupo' };
        }
        const r = this.enc.useItem(p, id, { target: p });
        if (r.ok) { audio.play('click'); this.afterAct(); }
        return r;
      },
      // LIBERDADE ASSUMIDA: no 5e, preparar magia é coisa de descanso longo.
      // Este sandbox não tem descanso nenhum — tem um encontro que começa na
      // primeira tela. Exigir a regra aqui deixaria a tela de preparação
      // inalcançável para sempre, que é pior que a liberdade. O que se mantém
      // é o que importa: não dá para reescrever o arsenal enquanto os
      // inimigos agem.
      podePreparar: () => (this.enc?.side === 'party' && !this.enc.over
        ? null
        : 'dá para preparar magias só no turno do grupo'),
      onPreparar: () => { audio.play('click'); this.refresh(); },
      onFechar: () => {
        this.refresh();
        document.querySelector('.ficha-overlay')?.classList.remove('na-vila');
        const depois = this._aoFecharFicha;
        this._aoFecharFicha = null;
        depois?.();
      },
    });

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'board';
    this.hud.boardWrap.append(this.canvas);

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.board?.render(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // O navegador só deixa tocar som depois de um gesto do usuário.
    const unlock = () => audio.unlock();
    addEventListener('pointerdown', unlock, { once: true, capture: true });
    addEventListener('keydown', unlock, { once: true, capture: true });

    addEventListener('keydown', (e) => {
      if (!this.enc || this.menu?.estaAberto()) return;
      if (e.key === 'Escape') { this.mode = null; this.refresh(); }
      if (e.key === 'Enter' && this.mode?.alvos?.length) { e.preventDefault(); this.conjurarEscolhidos(); }
      if (e.key === ' ' && this.enc?.side === 'party') { e.preventDefault(); this.endTurn(); }
      if (e.key === 'Tab') { e.preventDefault(); this.cycleSelection(); }
      const k = e.key.toLowerCase();
      if (k === 'm') { audio.toggleMute(); this.refresh(); }
      // `i` e `p` abrem a ficha. `c` NÃO: o HUD reservou essa tecla para
      // Desengajar, e as duas no mesmo atalho fariam o turno depender de qual
      // ouvinte foi registrado primeiro.
      if ((k === 'i' || k === 'p') && this.selected && !this.ficha?.estaAberta()) {
        e.preventDefault();
        this.ficha.abrir(this.selected, k === 'i' ? 'inventario' : 'ficha');
      }
    });

    // O MENU vem antes do tabuleiro. Ele é criado depois dos ouvintes de
    // teclado de cima de propósito: enquanto aberto, ele segura as teclas na
    // fase de captura, e o desbloqueio de som (também de captura) precisa
    // continuar recebendo o primeiro gesto.
    this.menu = criarMenu(root, {
      onIniciar: (config) => this.newEncounter(config),
      temPartida: () => Boolean(this.enc),
    });
    // O botão de voltar ao menu mora à esquerda do aviso de turno. O HUD
    // guarda a referência do aviso, então embrulhá-lo não o desliga.
    const menuBtn = document.createElement('button');
    menuBtn.className = 'btn btn-menu';
    menuBtn.textContent = 'Menu';
    menuBtn.addEventListener('click', () => { audio.play('click'); this.menu.abrir(); });
    const esquerda = document.createElement('div');
    esquerda.className = 'hud-topo-esq';
    this.hud.banner.replaceWith(esquerda);
    esquerda.append(menuBtn, this.hud.banner);
    this.montarLayoutLivre(esquerda);

    // `?encontro=` pula o menu e abre direto na arena: é o atalho de quem
    // testa (e dos agentes revisores, que abrem a página pela URL).
    const busca = new URLSearchParams(location.search);
    const direto = busca.get('encontro');
    if (direto) this.newEncounter({ modo: 'arena', variante: direto, nivel: Number(busca.get('nivel')) || 2 });
    else this.menu.abrir();
  }

  /**
   * Monta uma partida. `config` vem do menu: `{ modo, variante, nivel, ids,
   * aventura }`. Sem ele, repete a última — é o "Novo encontro" do fim.
   */
  newEncounter(config = this.config) {
    this.config = config;
    // A ficha guarda o personagem numa closure: aberta, continuaria mostrando
    // um combatente que não existe mais.
    this.ficha?.fechar();
    const seed = seedFromString(`encontro:${Date.now()}`);
    const rng = makeRng(seed);
    // A variante escolhe o encontro inteiro: mapa, posições e inimigos andam
    // juntos. `emboscada` é a estrada na mata, onde a campanha começa; `padrao`
    // é o encontro antigo, o que foi balanceado e que o simulador
    // (`src/dev/balance.js`) continua medindo; `grandes` é uma vitrine de
    // tamanho.
    // O capítulo 2 da campanha é o esconderijo dos goblins.
    const variante = config.capitulo === 2 ? 'esconderijo'
      : config.capitulo === 3 ? (config.cenaDaVila ?? 'rua')
        // Capítulo 4, a região: os encontros da estrada e os lugares dela.
        : config.capitulo === 4 ? config.cenaDaVila
        : (config.variante ?? 'emboscada');
    const mapa = mapaDo(variante);
    const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length,
      mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
    // As salas do mapa, por casa: o tabuleiro usa para apagar a parede da
    // sala em que o grupo está (ver `board.desenharParedes`).
    // A decoração pendurada nas paredes, por aresta ('x,y,N' ou 'x,y,O').
    if (mapa.decor) {
      field.decor = new Map(mapa.decor.map((d) => [`${d.x},${d.y},${d.lado}`, d.tipo]));
    }
    if (mapa.salas) {
      field.sala = new Map();
      for (const [nome, casas] of Object.entries(mapa.salas)) {
        for (const c of casas) field.sala.set(`${c.x},${c.y}`, nome);
      }
    }
    // Mapa com escuridão: breu por padrão, mais as fontes de luz dele (`rules/luz.js`).
    // `luz` é 'escuro' (breu inteiro) ou uma grade de dígitos 0-2 por casa.
    if (mapa.luz) {
      field.luz = new Uint8Array(field.w * field.h);
      if (Array.isArray(mapa.luz)) {
        mapa.luz.forEach((linha, y) => { for (let x = 0; x < field.w; x++) field.luz[y * field.w + x] = Number(linha[x] ?? 0); });
      }
      field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
    }

    // Campanha: os quatro heróis escolhidos, montados com o que o jogador
    // marcou na preparação (ou com a escolha automática). Arena: o grupo
    // pronto de `party.js`, no 2º nível.
    // Capítulo seguinte: os MESMOS heróis, com as feridas, os espaços gastos e
    // o que acharam pelo caminho (`continuarCom`). Quem morreu fica para trás.
    const party = config.continuarCom
      ? config.continuarCom.filter((c) => !c.dead)
      : config.herois
        ? config.herois.map(({ id, escolha }) => montarHeroi(id, escolha))
        : makeParty({ nivel: config.nivel ?? 2, ids: config.ids ?? null });
    // Partida nova: a campanha anterior (vila, missões, flags dos diálogos,
    // feitos, XP a receber) não vem junto.
    if (!config.continuarCom) {
      this.campanha = {};
      this.xpPendente = null;
    }
    if (config.continuarCom) {
      // A exaustão não é condição de combate: ela vem da estrada (fome, sede,
      // marcha forçada) e tem de atravessar a luta e o capítulo seguinte.
      for (const c of party) { c.tochaAcesa = false; c.conditions = (c.conditions ?? []).filter((k) => k.id === 'inconsciente' || k.id === 'exausto'); c.concentrating = null; }
      // As magias de utilidade da cena anterior ficaram para trás (o relógio segue).
      if (this.campanha?.utilidade) this.campanha.utilidade.ativas = [];
    }
    party.forEach((c, i) => {
      c.pos = { ...mapa.grupo[i] };
      c.facingVec = { ...mapa.olhar };
      aplicarAparencia(c);      // a figura entra com a arma e a armadura que tem
    });
    const foes = buildFoes(variante);
    // Campanha: os inimigos ficam fora do tabuleiro até a cena os chamar
    // (`game/capitulo1.js`) — o grupo explora a estrada antes da luta.
    // A arena da caverna também é uma cena: exploração no escuro antes da luta.
    const cena = mapa.cena === 'esconderijo' ? criarCapitulo2
      : mapa.cena === 'rua' ? criarRuaMarcarrubra
      : mapa.cena === 'mansao' ? criarMansao
      : mapa.cena === 'ermo' ? criarEstrada
      : mapa.cena === 'poco' ? criarPoco
      : mapa.cena === 'cume' ? criarCume
      : mapa.cena === 'castelo' ? criarCastelo
      : config.modo === 'campanha' ? criarCapitulo1
        : mapa.cena === 'caverna' ? criarCenaCaverna : null;
    const capitulo = Boolean(cena);
    this.inimigosEscondidos = capitulo ? foes : null;

    this.enc = new Encounter({
      battlefield: field,
      party,
      foes: capitulo ? [] : foes,
      rng,
      // Na campanha, a emboscada é a da aventura: quatro goblins, sem reforço.
      reinforcements: config.modo === 'campanha' ? () => null : (round) => reinforcementsFor(round, variante),
      emboscada: capitulo ? null : (mapa.emboscada ?? null),
      onLog: (entry) => { this.hud.pushLog(entry); this.contarNovidade?.(); },
      onEvent: (ev) => this.onEvent(ev),
    });
    // Ganchos do encontro para as magias de utilidade: o familiar entra na luta e o Alarme avisa o grupo
    // (numa emboscada de quem o Alarme cobre, ninguém é pego de surpresa).
    this.enc.aoComecar = (e) => familiarEntra(e, estadoDeUtilidade(this.campanha ??= {}));
    this.enc.protegidoDeSurpresa = (c) => Boolean(c.pos && alarmeCobre(estadoDeUtilidade(this.campanha ??= {}),
      this.enc.combatants.filter((h) => h.side === 'party' && !h.dead && h.hp > 0), this.capitulo?.lugar, c.pos));
    // O motor pergunta se é exploração (sacar arma de graça, salto sem contar
    // corrida); quem sabe é o capítulo.
    Object.defineProperty(this.enc, 'explorando', { get: () => !!this.capitulo?.explorando });

    this.hud.logList.replaceChildren();
    this.selected = null;
    this.mode = null;

    this.board = new Board(this.canvas, {
      encounter: this.enc,
      onTileClick: (t) => this.onTileClick(t),
      onTileHover: (t) => { this.onTileHover(t); this.board?.render(0); },
    });
    this.board.onCameraChange = () => this.refresh();
    // Botão direito sem arrastar: o menu de ações da casa.
    this.board.onTileContext = (tile, e) => this.abrirContexto(tile, e);
    fecharMenuContexto();

    this.capitulo = null;
    this.root.classList.remove('explorando');
    if (capitulo) {
      this.capitulo = cena(this, config);
      this.refresh();
      this.capitulo.iniciar();
      return;
    }

    this.enc.start();
    if (this.enc.side === 'party') this.select(this.firstActive());
    this.refresh();
  }

  // ---- eventos do motor ----------------------------------------------------

  /**
   * O motor resolve tudo de uma vez: quando o evento de dano chega, os PV já
   * caíram. `impactDelay` segura o número e o clarão até o instante em que a
   * animação chega no alvo — a flecha pousar, o dardo estourar. É zerado no
   * microtask seguinte, então vale só para a ação em curso.
   */
  setImpactDelay(seconds) {
    this.impactDelay = seconds;
    queueMicrotask(() => { this.impactDelay = 0; });
  }

  atImpact(fn) {
    const d = this.impactDelay ?? 0;
    if (d > 0) setTimeout(fn, d * 1000);
    else fn();
  }

  onEvent(ev) {
    // A cena do capítulo também escuta o combate (mortes, troca de lado).
    this.capitulo?.evento?.(ev);
    const board = this.board;
    switch (ev.type) {
      case 'moved': {
        ev.actor.facingVec = { dx: ev.to.x - ev.from.x, dy: ev.to.y - ev.from.y };
        // O motor já moveu a peça; isto conta a viagem quadrado a quadrado.
        // O andar vem da criatura: a gelatina escorre, a aranha treme, o
        // zumbi arrasta uma perna, o ogro parte e para seco.
        board?.fx.walk(ev.actor, ev.path, {
          andar: andarDe(ev.actor),
          onStep: () => audio.play('step'),
        });
        break;
      }

      case 'attack': {
        const a = ev.attacker;
        const t = ev.target;
        a.facingVec = { dx: t.pos.x - a.pos.x, dy: t.pos.y - a.pos.y };
        a.anim = { name: 'attack', frame: 1 };
        setTimeout(() => { a.anim = null; }, 280);
        // A receita da arma toca som, anima e devolve quando o golpe chega.
        // Se quem ataca ainda está andando, o golpe espera a chegada.
        const espera = (board?.fx.walkTimeLeft ?? 0);
        this.setImpactDelay(playWeaponVisual(board, ev, { startDelay: espera }));
        // Duas coisas que o jogador nunca descobre sozinho e que o motor
        // agora calcula: de quanto foi o erro, e quando vantagem e
        // desvantagem se anularam — que é contraintuitivo e muda a decisão
        // seguinte.
        if (ev.errouPorPouco) {
          this.atImpact(() => board?.floatText(t.pos, `faltou ${ev.faltou}`, '#ffc83a'));
        }
        if (ev.anulado) this.hud.setHint('vantagem e desvantagem se anulam — rolagem normal');
        break;
      }

      case 'spell': {
        const { caster, spell, target, point } = ev;
        const dest = target?.pos ?? point ?? caster.pos;
        caster.facingVec = { dx: dest.x - caster.pos.x, dy: dest.y - caster.pos.y };
        // o gesto de magia, para quem tem um desenhado; os outros, o golpe.
        // Os dois quadros: CARREGA e depois SOLTA.
        caster.anim = { name: 'conjurar', frame: 0 };
        setTimeout(() => { if (caster.anim?.name === 'conjurar') caster.anim.frame = 1; }, 150);
        setTimeout(() => { caster.anim = null; }, 420);
        this.setImpactDelay(playSpellVisual(board, ev));
        break;
      }

      // Golpe preparado (Trovejante, Abrasador, Colérico, Marcante, Cegante,
      // Saraivada): o efeito toca no ACERTO, junto do golpe da arma.
      case 'golpeMagico': {
        // Flecha Relampejante: faísca no alvo e um anel de raios na explosão.
        if (ev.efeito === 'flecha') {
          // O raio corre do atirador ao alvo (~0,25 s) antes da faísca.
          board?.fx.projectile(ev.atacante.pos, ev.alvo.pos, { style: 'sprite', sprite: 'flecha-raio', dur: 0.25, arc: 0.15 });
          this.atImpact(() => {
            board?.fx.quadros(ev.alvo.pos, 'eletrico-faisca', { fps: 16, altura: 24 });
            board?.fx.ring(ev.alvo.pos, { color: '#bfe6ff', radius: 90, dur: 0.5, width: 3 });
            board?.bump(0.35);
          });
          break;
        }
        const espinhos = ev.efeito === 'espinhos' || ev.efeito === 'constringe';
        const nome = espinhos ? 'vinhas'
          : { fogo: 'golpe-fogo', 'psíquico': 'golpe-psiquico', trovejante: 'golpe-trovao' }[ev.tipo] ?? 'golpe-divino';
        this.atImpact(() => board?.fx.quadros(ev.alvo.pos, nome, espinhos ? { fps: 12, altura: 18 } : { fps: 8, sumir: 0.25 }));
        break;
      }

      // Lote 12: a runa estoura, uma flecha do cordão voa, o voador pousa de pé, a magia é anulada.
      case 'glifo': {
        playGlifoVisual(board, ev);
        break;
      }
      case 'cordao': {
        playCordaoVisual(board, ev);
        break;
      }
      case 'pousou': {
        board?.fx.motes(ev.target.pos, { color: '#dff3ff', count: 8, rise: 18, spread: 18, dur: 0.6 });
        break;
      }
      case 'anulada': {
        playAnuladaVisual(board, ev);
        break;
      }

      // Criaturas invocadas pelo grupo (Conjurar Animais, Animar os Mortos).
      case 'invocado': {
        const morto = ev.criatura.tipo === 'morto-vivo';
        board?.fx.ring(ev.criatura.pos, { color: morto ? '#9ff0b8' : '#8fe6a8', radius: 46, dur: 0.7, width: 3 });
        board?.fx.motes(ev.criatura.pos, { color: morto ? '#7fa890' : '#d9f7c4', count: 12, rise: 40, spread: 24, dur: 0.9 });
        break;
      }
      case 'dispensado': {
        // O familiar guarda os PV na campanha (e some do registro se caiu).
        if (ev.target.familiar && familiarSai(estadoDeUtilidade(this.campanha ??= {}), ev.target)) {
          this.enc?.say('magia', `${ev.target.name} se desfaz em fumaça: o espírito volta ao seu lugar. Refaça Convocar Familiar para chamar outro.`);
        }
        board?.fx.motes(ev.target.pos, { color: '#c7b4ff', count: 10, rise: 34, spread: 20, dur: 0.8 });
        break;
      }
      // Piscar: o clarão de quem some e o de quem volta.
      case 'sumiu': {
        board?.fx.ring(ev.de, { color: '#bfe6ff', radius: 40, dur: 0.6, width: 2 });
        board?.fx.motes(ev.de, { color: '#e8f4ff', count: 12, rise: 46, spread: 20, dur: 0.8 });
        break;
      }
      case 'voltou': {
        board?.fx.ring(ev.to, { color: '#bfe6ff', radius: 40, dur: 0.6, width: 2 });
        board?.fx.motes(ev.to, { color: '#e8f4ff', count: 10, rise: 30, spread: 18, dur: 0.7 });
        break;
      }

      case 'reinforcements': {
        audio.play('down');
        for (const u of ev.units) {
          board?.fx.ring(u.pos, { color: '#ff6a4b', radius: 44, dur: 0.7 });
          board?.floatText(u.pos, '!', '#ff6a4b', true);
        }
        break;
      }

      case 'redirect': {
        board?.floatText(ev.from.pos, 'empurrado!', '#ffc83a');
        board?.fx.ring(ev.to.pos, { color: '#ffc83a', radius: 26, dur: 0.4, width: 2 });
        audio.play('step');
        break;
      }

      case 'ignite': {
        board?.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 6, dur: 0.7, scale: 1.2 });
        board?.floatText(ev.target.pos, 'pegou fogo!', '#ff8a3a');
        audio.play('castFire');
        break;
      }

      case 'burn': {
        board?.fx.flames(ev.target.pos, { color: '#ff6a2a', count: 4, dur: 0.45 });
        audio.play('castFire');
        break;
      }

      case 'damage': {
        const { target, amount } = ev;
        this.atImpact(() => {
          target.flash = 1;
          // O ENCOLHIMENTO DE DOR, que existia na arte e nunca aparecia.
          // Todo pintor do projeto honra `pose.kind === 'hurt'` — são vinte
          // lugares entre `draw.js` e os planos — mas nada no jogo escolhia
          // essa animação: ela era desenhada nas setenta folhas e morria lá.
          // Quem já está no chão não encolhe: a pose de caído vence.
          if (!target.dead && !hasCondition(target, 'inconsciente')) {
            target.anim = { name: 'hurt', frame: 0 };
            setTimeout(() => {
              // Só limpa se ainda for a dor: um golpe que chegue no meio não
              // pode ter a própria animação apagada pelo relógio do anterior.
              if (target.anim?.name === 'hurt') target.anim = null;
            }, 220);
          }
          board?.floatText(target.pos, `-${Math.round(amount)}`, '#ff6a6a', amount >= 10);
          board?.bump(0.22);
        });
        break;
      }

      case 'heal': {
        if (ev.amount > 0) {
          const { target, amount } = ev;
          this.atImpact(() => {
            board?.floatText(target.pos, `+${Math.round(amount)}`, '#6ee89a');
            board?.fx.ring(target.pos, { color: '#6ee89a', radius: 28, dur: 0.5, width: 2 });
          });
        }
        break;
      }

      case 'downed':
      case 'died': {
        const { target } = ev;
        this.atImpact(() => {
          board?.floatText(target.pos, '✖', '#ff4b4b', true);
          // Esqueleto desmonta, gelatina derrete, espectro se dissipa. Um
          // respingo de sangue para os três joga fora metade do que o
          // bestiário conquistou — e esqueleto não sangra.
          if (ev.type === 'died' && target.kind === 'npc') {
            playDeathVisual(board, target);
          } else {
            board?.fx.impact(target.pos, { color: '#8a2b2b', count: 14, spread: 40, dur: 0.6 });
            audio.play('down');
          }
        });
        break;
      }

      case 'sideStart': {
        audio.play('turn');
        if (ev.side === 'foes') {
          this.selected = null;
          this.mode = null;
          queueMicrotask(() => this.runFoes());
        } else {
          this.select(this.firstActive());
          // Invocados em "agir sozinho" jogam o turno deles, sem pedir nada.
          if (this.enc.combatants.some((x) => x.invocado?.auto && x.side === 'party' && !x.acted)) queueMicrotask(() => this.runInvocadosAuto());
        }
        break;
      }

      case 'end': {
        this.selected = null;
        this.mode = null;
        const outcome = ev.outcome;
        setTimeout(() => audio.play(outcome === 'vitoria' ? 'victory' : 'defeat'), 500);
        // Na campanha, o fim da luta é a próxima cena, não o fim do jogo.
        if (this.capitulo) setTimeout(() => this.capitulo?.fimDoCombate(outcome), 1400);
        break;
      }

      default:
        break;
    }
    this.refresh();
  }

  async runFoes() {
    this.refresh();
    // A pausa entre monstros tem que ser maior que a animação do golpe, senão
    // um começa a agir enquanto o anterior ainda está no ar: flecha viajando
    // (0,3 s) + estilhaços (0,42 s) ≈ 0,7 s.
    await runMonsterSide(this.enc, { delayMs: () => 420 + this.walkWaitMs, onStep: () => this.refresh() });
    this.refresh();
  }

  async runInvocadosAuto(donoId = null) {
    this.refresh();
    await runAutoSummons(this.enc, { donoId, delayMs: () => 420 + this.walkWaitMs, onStep: () => this.refresh() });
    if (this.selected?.acted) this.select(this.firstActive());
    this.refresh();
  }

  alternarAuto(c) {
    if (!c?.invocado) return;
    this.enc.definirAutoDoInvocado(c, !c.invocado.auto);
    audio.play('click');
    if (c.invocado.auto && this.enc.side === 'party' && !c.acted) { this.runInvocadosAuto(); return; }
    this.refresh();
  }

  alternarAutoDoDono(dono) {
    const lista = this.enc.invocadosDe(dono);
    const todosAuto = lista.length > 0 && lista.every((x) => x.invocado.auto);
    this.enc.definirAutoDosInvocados(dono, !todosAuto);
    audio.play('click');
    if (!todosAuto && this.enc.side === 'party') { this.runInvocadosAuto(dono.id); return; }
    this.refresh();
  }

  // ---- seleção e modos -----------------------------------------------------

  firstActive() {
    // A cena pode ter fechado o tabuleiro (fim da luta, ida para a vila ou a
    // região) com o turno dos inimigos ainda terminando.
    if (!this.enc) return null;
    return this.enc.allOf('party').find((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente') && !c.invocado?.auto) ?? null;
  }

  cycleSelection() {
    const list = this.enc.allOf('party').filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente') && !c.invocado?.auto);
    if (list.length === 0) return;
    const i = list.indexOf(this.selected);
    this.select(list[(i + 1) % list.length]);
  }

  select(c) {
    if (c && (c.dead || hasCondition(c, 'inconsciente') || c.side !== 'party')) return;
    this.selected = c;
    this.mode = null;
    this.refresh();
  }

  chooseAction(action) {
    const c = this.selected;
    if (!c || this.enc.side !== 'party') return;

    // Fora do combate, a magia de utilidade é conjurada pelo relógio (`rules/utilidade.js`).
    if (action.kind === 'spell' && this.capitulo?.explorando && UTIL_FORA.has(action.spellId) && !narrativaAberta()) {
      escolherEConjurar(this, c, action.spellId);
      return;
    }

    if (action.kind === 'despertar') {
      const alvo = this.enc.combatants.find((x) => x.id === action.targetId);
      if (alvo) this.enc.despertarFingido(c, alvo);
      this.afterAct();
      return;
    }
    if (action.kind === 'arrancarGrudado') {
      const s = this.enc.combatants.find((x) => x.id === action.targetId);
      const r = s ? this.enc.arrancarGrudado(c, s) : { ok: false, why: 'não há stirge' };
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }
    if (action.kind === 'stabilize') {
      const alvo = this.enc.combatants.find((x) => x.id === action.targetId);
      if (alvo) this.enc.stabilize(c, alvo);
      this.afterAct();
      return;
    }
    if (action.kind === 'examinar' || action.kind === 'investigar') {
      const r = action.kind === 'examinar' ? this.enc.examinarIlusao(c, action.zona ?? null) : this.enc.investigarIlusao(c);
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }
    if (action.kind === 'dash') { this.enc.dash(c); this.afterAct(); return; }
    if (action.kind === 'dodge') { this.enc.dodge(c); this.afterAct(); return; }
    if (action.kind === 'disengage') { this.enc.disengage(c); this.afterAct(); return; }
    // Sacar a arma guardada: a figura troca de folha junto (a família da arma).
    if (action.kind === 'sacar') {
      const r = this.enc.sacarArma(c, action.weaponId);
      if (!r.ok) { this.refuse(c, r.why); return; }
      aplicarAparencia(c);
      this.afterAct();
      return;
    }
    // Saltar: entra no modo de escolher a casa de pouso (ou sai dele).
    if (action.kind === 'salto') {
      this.mode = this.mode?.kind === 'salto' ? null : { kind: 'salto' };
      this.refresh();
      return;
    }
    if (action.kind === 'standUp' || action.kind === 'escape') {
      const r = action.kind === 'standUp' ? this.enc.standUp(c) : this.enc.escapar(c);
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }
    if (action.kind === 'feature') {
      this.enc.useFeature(c, action.featureId, { modo: action.modo });
      this.afterAct();
      return;
    }
    // Item de usar. O que tem alvo decidido (beber a própria poção, o kit no
    // aliado caído ao lado) resolve na hora; o que é arremessado cai no modo
    // de alvo junto com ataque e magia, logo abaixo.
    if (action.kind === 'item' && !action.mira) {
      const alvo = action.targetId
        ? this.enc.combatants.find((x) => x.id === action.targetId)
        : c;
      const r = this.enc.useItem(c, action.itemId, { target: alvo ?? c });
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }
    // Clicar num círculo da fileira de espaços, com uma magia na mira,
    // escolhe em que círculo ela sai.
    if (action.kind === 'circulo') {
      if (this.mode?.kind !== 'spell') return;
      const spell = getSpell(this.mode.spellId);
      if (this.enc.circuloDeConjuracao(c, spell, action.lvl) === null) {
        this.refuse(c, `não dá para conjurar ${spell.name} no ${action.lvl}º círculo`);
        return;
      }
      this.mode = { ...this.mode, circulo: action.lvl };
      // Mais alvos no círculo maior; menos no menor corta a lista.
      this.mode.alvos = this.mode.alvos.slice(0, this.enc.alvosDaMagia(spell, action.lvl, c));
      this.refresh();
      return;
    }
    // Ataques e magias entram em modo de alvo.
    if (action.kind === 'spell') {
      const spell = getSpell(action.spellId);
      // Magia só em si mesmo (Vida Falsa, Borrão, Espíritos Guardiões)
      // resolve na hora.
      const ativa = c.magiasAtivas?.[spell.id];
      if (spell.kind === 'tempHp' || spell.kind === 'aura' || spell.kind === 'disparada' || spell.kind === 'reacao'
        || spell.kind === 'frutos' || spell.kind === 'rastro' || spell.kind === 'invocar'
        || (spell.kind === 'buff' && spell.rangeFt === 0)
        || (['lamina', 'curaReuso'].includes(spell.kind) && !ativa)) {
        this.tryCast(c, action.spellId);
        return;
      }
      // Clicar de novo na magia com alvos já escolhidos CONJURA.
      if (this.mode?.kind === 'spell' && this.mode.spellId === action.spellId && this.mode.alvos?.length) {
        this.conjurarEscolhidos();
        return;
      }
      if (!(this.mode?.kind === 'spell' && this.mode.spellId === action.spellId)) {
        this.mode = { ...action, circulo: this.enc.circuloDeConjuracao(c, spell), alvos: [] };
        this.refresh();
        return;
      }
    }
    this.mode = this.mode?.kind === action.kind
      && this.mode.weaponId === action.weaponId
      && this.mode.spellId === action.spellId
      ? null
      : action;
    this.refresh();
  }

  /** A magia de vários alvos (Bênção, Míssil Mágico) escolhe um por clique. */
  escolheVarios(spell) {
    return ['buff', 'debuff', 'auto', 'raios', 'healGrupo'].includes(spell.kind) || (spell.kind === 'save' && !!spell.alvos);
  }

  /**
   * Um clique num alvo de magia de vários alvos: marca (ou desmarca) e,
   * completa a conta, conjura. No Míssil Mágico o mesmo alvo pode levar mais
   * de um dardo; nas outras, clicar de novo desmarca.
   */
  marcarAlvo(c, spell, alvo) {
    const why = this.enc.porqueNaoAlvo(c, spell, alvo);
    if (why) { this.refuse(c, why); return; }
    const max = this.enc.alvosDaMagia(spell, this.mode.circulo, c);
    const alvos = this.mode.alvos;
    const i = alvos.indexOf(alvo);
    // Dardo e raio podem repetir o alvo; aliado e inimigo das outras, não.
    if (!['auto', 'raios'].includes(spell.kind) && i >= 0) alvos.splice(i, 1);
    else if (alvos.length < max) {
      // Lentidão (cubo de 12 m) e Respingo Ácido (a 1,5 m do primeiro):
      // recusa na hora, com o motivo, em vez de o alvo sumir ao conjurar.
      if (spell.cuboFt && this.enc.dentroDoCubo(spell, [...alvos, alvo]).length <= alvos.length) {
        this.refuse(c, `fora do cubo de ${(spell.cuboFt / 5) * 1.5} m dos já marcados`);
        this.refresh();
        return;
      }
      if (spell.juntosFt && alvos.length && distanceFt(alvo.pos, alvos[0].pos) > spell.juntosFt) {
        this.refuse(c, `o segundo alvo tem de estar a até ${(spell.juntosFt / 5) * 1.5} m do primeiro`);
        this.refresh();
        return;
      }
      alvos.push(alvo);
    }
    if (alvos.length >= max) { this.conjurarEscolhidos(); return; }
    this.refresh();
  }

  conjurarEscolhidos() {
    const c = this.selected;
    if (!c || this.mode?.kind !== 'spell' || !this.mode.alvos?.length) return;
    this.tryCast(c, this.mode.spellId, { target: this.mode.alvos[0], targets: [...this.mode.alvos] });
  }

  /**
   * Recusa visível: diz o porquê e NÃO gasta nada.
   *
   * O motivo vai num CAMPO, não direto na dica. A versão anterior escrevia na
   * dica e chamava `refresh()` na linha seguinte — e `refresh()` termina
   * reescrevendo a dica com "clique num quadrado azul para mover". Resultado:
   * o jogador via o ✖ e ouvia o som, e a explicação durava menos que um
   * quadro. Guardar aqui faz a mensagem sobreviver exatamente ao refresh que
   * vem logo atrás, e sumir no próximo — que é o tempo certo de um aviso.
   */
  refuse(actor, why) {
    this.recusa = why;
    this.board?.floatText(actor.pos, '✖', '#ffb04a');
    audio.play('deny');
    this.refresh();
  }

  /** Quanto tempo a animação de caminhada ainda vai levar, em ms. */
  get walkWaitMs() {
    return Math.ceil((this.board?.fx.walkTimeLeft ?? 0) * 1000);
  }

  /** Espera a caminhada terminar antes de resolver o golpe, para ler na ordem. */
  afterWalk(fn) {
    const wait = this.walkWaitMs;
    if (wait <= 0) { fn(); return; }
    this.busy = true;
    this.refresh();
    setTimeout(() => { this.busy = false; fn(); }, wait + 40);
  }

  /**
   * Ataque com um clique. Se for corpo a corpo e o alvo estiver longe, o
   * personagem ANDA até ele gastando movimento e então ataca. Se o movimento
   * não der para chegar, avança o máximo possível e não ataca — mas a ação
   * continua disponível.
   */
  tryAttack(c, target, weaponId) {
    const enc = this.enc;
    const check = enc.canAttack(c, target, weaponId);

    if (check.ok) {
      const r = enc.attackAction(c, target, weaponId);
      this.mode = null;
      if (!r.ok) { this.refuse(c, r.why); return; }
      this.afterAct();
      return;
    }

    const prof = enc.weaponAttackProfile(c, weaponId);
    // Arma à distância não resolve andando: o problema é visão ou alcance.
    if (prof.ranged) { this.refuse(c, check.why); return; }
    if (!enc.podeAtacar(c)) { this.refuse(c, 'a ação deste turno já foi usada'); return; }
    if (c.movementLeftFt <= 0) { this.refuse(c, `sem movimento para chegar até ${target.name}`); return; }

    const reached = enc.reachableFor(c);
    let encosta = null;
    let maisPerto = null;
    for (const node of reached.values()) {
      if (enc.occupied(node.x, node.y, c)) continue;
      const d = distanceFt({ x: node.x, y: node.y }, target.pos);
      if (d <= prof.reachFt && (!encosta || node.cost < encosta.node.cost)) encosta = { node, d };
      if (!maisPerto || d < maisPerto.d || (d === maisPerto.d && node.cost < maisPerto.node.cost)) maisPerto = { node, d };
    }

    if (encosta) {
      enc.moveAlong(c, Battlefield.pathFrom(reached, encosta.node));
      this.mode = null;
      this.afterWalk(() => {
        const r = enc.attackAction(c, target, weaponId);
        if (!r.ok) this.refuse(c, r.why);
        else this.afterAct();
      });
      return;
    }

    // Não chega neste turno: avança o que der e guarda a ação.
    if (maisPerto && maisPerto.node.cost > 0) {
      enc.moveAlong(c, Battlefield.pathFrom(reached, maisPerto.node));
      this.mode = null;
      this.afterWalk(() => this.refuse(c, `movimento insuficiente para alcançar ${target.name} — avançou o máximo possível, a ação continua sua`));
      return;
    }
    this.refuse(c, check.why);
  }

  /** Conjuração com um clique, recusando sem gastar quando não dá. */
  tryCast(c, spellId, { target = null, point = null, targets = null, opcao = null } = {}) {
    const circulo = this.mode?.kind === 'spell' && this.mode.spellId === spellId ? this.mode.circulo : null;
    // Magia com escolha (Aprimorar Atributo, Glifo de Proteção): pergunta antes
    // de gastar. Esc fecha o seletor e deixa a mira como estava.
    const lista = opcao ? null : opcoesDaMagia(getSpell(spellId));
    if (lista) {
      const sugerida = getSpell(spellId).escolheTipoDoGlifo
        ? this.enc.tipoDoGlifo(null, c)
        : this.enc.opcaoDeAprimorar(target ?? c);
      const ordem = [...lista].sort((a, b) => (b.id === sugerida) - (a.id === sugerida));
      abrirMenuContexto(this.root, {
        x: NaN, y: NaN, titulo: getSpell(spellId).name, subtitulo: 'escolha uma opção',
        opcoes: ordem.map((o) => ({
          rotulo: o.rotulo, detalhe: o.id === sugerida ? `sugerida — ${o.detalhe ?? ''}` : o.detalhe,
          destaque: o.id === sugerida,
          fazer: () => this.tryCast(c, spellId, { target, point, targets, opcao: o.id }),
        })),
      });
      return;
    }
    const r = this.enc.castSpell(c, spellId, { target, point, targets, circulo, opcao });
    this.mode = null;
    if (!r.ok) { this.refuse(c, r.why); return; }
    this.afterAct();
  }

  onTileClick(tile) {
    if (this.ficha?.estaAberta() || narrativaAberta()) return;
    if (this.enc.over || this.enc.side !== 'party' || this.busy) return;
    const occupant = this.enc.at(tile.x, tile.y);
    const c = this.selected;

    // Modo de alvo
    if (this.mode && c) {
      if (this.mode.kind === 'salto') {
        const r = this.enc.pular(c, tile);
        if (!r.ok) { this.refuse(c, r.why); return; }
        this.mode = null;
        // Explorando: a cena vê o pouso como vê um passo (vigias, armadilhas).
        if (this.capitulo?.explorando) this.afterWalk(() => this.capitulo?.depoisDeMover(c));
        this.afterAct();
        return;
      }
      const magia = this.mode.kind === 'spell' ? getSpell(this.mode.spellId) : null;
      // Revivificar mira o CORPO, que `at` não devolve (morto não ocupa casa).
      if (magia?.kind === 'reviver') {
        const corpo = this.enc.combatants.find((x) => x.dead && x.side === c.side && x.pos.x === tile.x && x.pos.y === tile.y);
        if (corpo) this.tryCast(c, this.mode.spellId, { target: corpo });
        else this.refuse(c, 'clique no corpo de um aliado');
        this.refresh();
        return;
      }
      // Animar os Mortos também mira o corpo, mas de qualquer lado.
      if (magia?.kind === 'animarMortos') {
        const corpo = this.enc.combatants.find((x) => x.dead && x.pos.x === tile.x && x.pos.y === tile.y && !x.reerguido && !x.invocado);
        if (corpo) this.tryCast(c, this.mode.spellId, { target: corpo });
        else this.refuse(c, 'clique num cadáver');
        this.refresh();
        return;
      }
      // Levitação já em curso: a ação leva o levitante para a casa clicada.
      if (magia?.kind === 'levitar' && c.magiasAtivas?.[magia.id] && !occupant) { this.tryCast(c, this.mode.spellId, { point: tile }); return; }
      // Passo Nebuloso mira a casa de chegada.
      if (magia?.mira === 'casa') { this.tryCast(c, this.mode.spellId, { point: tile }); return; }
      // No escuro, quem o grupo não vê não é alvo: mirar nele seria saber que está lá.
      if (occupant && this.board?.figuraVisivel(occupant) === false && !magia?.shape) {
        this.refuse(c, 'no escuro, não se vê ninguém ali');
        return;
      }
      if (!occupant) {
        // Dissipar Magia também mira uma casa de zona.
        if (magia?.shape || magia?.kind === 'dissipar') this.tryCast(c, this.mode.spellId, { point: tile });
        return;
      }
      if (this.mode.kind === 'attack') {
        if (occupant.side === c.side) { this.select(occupant); return; }
        this.tryAttack(c, occupant, this.mode.weaponId);
        return;
      }
      if (this.mode.kind === 'spell') {
        const spell = getSpell(this.mode.spellId);
        // Magia de área mira a CASA clicada, como a prévia — não a âncora da
        // criatura Grande que estiver nela.
        if (spell.shape) { this.tryCast(c, this.mode.spellId, { point: tile }); return; }
        if (this.escolheVarios(spell)) { this.marcarAlvo(c, spell, occupant); return; }
        this.tryCast(c, this.mode.spellId, { target: occupant, point: occupant.pos });
        return;
      }
      if (this.mode.kind === 'item') {
        // `useItem` já recusa alcance e linha de visão, com o motivo pronto:
        // repetir as guardas aqui seria uma segunda regra para divergir da
        // primeira.
        const r = this.enc.useItem(c, this.mode.itemId, { target: occupant });
        if (!r.ok) { this.refuse(c, r.why); return; }
        this.mode = null;
        this.afterAct();
        return;
      }
    }

    // Seleção
    if (occupant && occupant.side === 'party') { this.select(occupant); return; }
    if (occupant) return;

    // Movimento
    if (!c) return;
    const reached = this.enc.reachableFor(c);
    const node = reached.get(key(tile.x, tile.y));
    if (!node || node.cost === 0) return;
    this.enc.moveAlong(c, Battlefield.pathFrom(reached, tile));
    // Explorando: depois do passo, a cena vê se a armadilha dispara.
    if (this.capitulo?.explorando) this.afterWalk(() => this.capitulo?.depoisDeMover(c));
    this.refresh();
  }

  /**
   * Quem é o alvo "em consideração".
   *
   * Com um inimigo aqui, cada azulejo de arma da barra passa a mostrar a
   * chance de acerto contra ELE em vez de só o dado da tabela. É o circuito
   * que faltava: a conta existia em `odds.js` e morava a meia tela de
   * distância de onde se escolhe a arma.
   *
   * Só redesenha quando o alvo MUDA. O hover do tabuleiro dispara a cada
   * movimento do mouse, e um `update()` por pixel percorrido derrubaria o
   * quadro a quadro.
   */
  definirAlvo(candidato) {
    const c = this.selected;
    const novo = candidato && c && candidato.side !== c.side && !candidato.dead ? candidato : null;
    if (novo === this.alvo) return;
    this.alvo = novo;
    this.hud.update(this.enc, c, this.mode, this.alvo);
  }

  onTileHover(tile) {
    const c = this.selected;
    this.definirAlvo(tile ? this.enc.at(tile.x, tile.y) : null);

    if (!c || this.enc.side !== 'party' || this.mode) {
      this.board?.setOverlay({ path: null });
      if (this.mode && tile) this.updateHint(tile);
      return;
    }
    if (!tile) { this.board?.setOverlay({ path: null }); return; }
    const reached = this.enc.reachableFor(c);
    const node = reached.get(key(tile.x, tile.y));
    if (!node || this.enc.occupied(tile.x, tile.y, c)) {
      this.board?.setOverlay({ path: null });
      this.hud.setHint('');
      return;
    }
    this.board?.setOverlay({ path: Battlefield.pathFrom(reached, tile) });
    this.hud.setHint(`Mover ${node.cost} pés (restam ${c.movementLeftFt - node.cost})`);
  }

  updateHint(tile) {
    const c = this.selected;
    const target = this.enc.at(tile.x, tile.y);
    if (!c || !target || !this.mode) { this.hud.setHint(''); return; }
    if (this.mode.kind === 'attack') {
      const check = this.enc.canAttack(c, target, this.mode.weaponId);
      if (!check.ok) { this.hud.setHint(`✖ ${check.why}`); return; }
      const mods = this.enc.attackModifiers(c, target, { ranged: check.profile.ranged });
      const bits = [`CA ${target.ac}`, `${check.profile.damage} ${check.profile.type}`];
      if (mods.advantage && !mods.disadvantage) bits.push(`vantagem (${mods.reasons.join(', ')})`);
      if (mods.disadvantage && !mods.advantage) bits.push(`desvantagem (${mods.reasons.join(', ')})`);
      if (check.longRange) bits.push('alcance longo');
      this.hud.setHint(bits.join(' · '));
    } else if (this.mode.kind === 'spell') {
      const s = getSpell(this.mode.spellId);
      const why = this.enc.porqueNaoAlvo(c, s, target);
      this.hud.setHint(why && !s.shape ? `✖ ${why}` : this.dicaDaMagia(c, s));
    }
  }

  /** A linha de dica da magia na mira: círculo, alvos escolhidos e como conjurar. */
  dicaDaMagia(c, s) {
    const circ = s.level > 0 && this.mode.circulo > s.level ? ` · no ${this.mode.circulo}º círculo` : '';
    if (this.escolheVarios(s)) {
      const max = this.enc.alvosDaMagia(s, this.mode.circulo, c);
      const n = this.mode.alvos.length;
      const quem = s.kind === 'auto' ? `${max} dardos: clique num inimigo por dardo (pode repetir)`
        : s.kind === 'raios' ? `${max} raios: clique num inimigo por raio (pode repetir)`
        : this.enc.miraAliados(s) ? `escolha até ${max} aliado${max > 1 ? 's' : ''}` : `escolha até ${max} inimigo${max > 1 ? 's' : ''}`;
      return `${s.name}${circ} — ${quem} · ${n}/${max}${n ? ' · Enter ou a magia de novo conjura agora' : ''}`;
    }
    if (s.zona?.movel && c.magiasAtivas?.[s.id]?.zona) return `Mover ${s.name} — clique no destino (até ${s.zona.movel / 5 * 1.5} m de onde está, sem gastar espaço)`;
    if (s.shape) return `${s.name}${circ} — aponte a área e clique`;
    if (s.mira === 'casa') return `${s.name}${circ} — clique na casa de chegada (até ${s.rangeFt / 5 * 1.5} m)`;
    if (s.kind === 'reviver') return `${s.name}${circ} — clique no corpo de um aliado ao seu lado`;
    if (s.reuso && c.magiasAtivas?.[s.id]) return `${s.name} — já ativa: clique no alvo para golpear de novo, sem gastar espaço`;
    return `${s.name}${circ} — clique no ${this.enc.miraAliados(s) ? 'aliado' : 'alvo'}`;
  }

  afterAct() {
    const c = this.selected;
    // Terminou tudo que podia? passa para o próximo automaticamente.
    if (c && c.actionUsed && c.bonusUsed && c.movementLeftFt <= 0) this.enc.endTurn(c);
    if (c?.acted) this.select(this.firstActive());
    this.refresh();
  }

  endTurn() {
    const c = this.selected;
    if (!c || this.enc.side !== 'party' || this.capitulo?.explorando) return;
    // Terminar o turno do dono encerra também os invocados dele (os "sozinhos" jogam antes).
    this.selected = null;
    encerrarTurnoComInvocados(this.enc, c, { delayMs: () => 420 + this.walkWaitMs, onStep: () => this.refresh() }).then(() => {
      if (this.enc.side === 'party') this.select(this.firstActive());
      this.refresh();
    });
  }

  refresh() {
    if (!this.enc) return;   // ainda no menu, sem partida
    const c = this.selected;
    // Quem acende como alvo possível: na magia, quem a magia aceita (aliado
    // na cura e na Bênção, inimigo no resto); magia de área não acende
    // ninguém, quem mostra o que ela pega é a prévia da área.
    const magia = this.mode?.kind === 'spell' ? getSpell(this.mode.spellId) : null;
    const salto = this.mode?.kind === 'salto';
    const targets = this.mode && c && !salto
      ? magia
        ? (magia.shape ? [] : this.enc.combatants.filter((t) => !this.enc.porqueNaoAlvo(c, magia, t)))
        : this.enc.combatants.filter((t) => !t.dead && t.side !== c.side
          && (this.mode.kind !== 'attack' || this.enc.canAttack(c, t, this.mode.weaponId).ok))
      : null;

    this.board?.setOverlay({
      selected: c,
      // No modo de salto, o chão azul são as casas de pouso.
      reachable: c && this.enc.side === 'party'
        ? (salto ? this.enc.destinosDoSalto(c) : !this.mode ? this.enc.reachableFor(c) : null)
        : null,
      targets,
      // O Detectar Magia ativo acende o chão onde há aura (`game/magias-fora.js`).
      auras: this.capitulo?.explorando ? aurasDoDetectarMagia(this) : null,
      // As colunas de luz das magias de utilidade: Bem e Mal, armadilhas, Localizar Objeto, o que o bicho viu.
      marcas: this.capitulo?.explorando ? marcasDoJogo(this) : null,
      path: null,
      // `mode` é a chave que acende a camada de previsão inteira do tabuleiro:
      // chão de alcance, tracejado do alcance longo, cruz de alvo impossível e
      // o cartão de chance de acerto. Sem ela, `modoDeAlvo()` devolve null
      // para sempre e nada daquilo aparece.
      mode: this.mode,
    });
    // No escuro, quem o grupo não vê some também do HUD (fila e lista de inimigos).
    const visao = temEscuridaoEm(this.enc) ? visaoDoGrupo(this.enc) : null;
    for (const x of this.enc.combatants) x.oculto = Boolean(visao) && x.side !== 'party' && !visao.has(`${x.pos.x},${x.pos.y}`);
    this.hud.update(this.enc, c, this.mode, this.alvo);
    // A ficha fica por cima do jogo e não escuta o encontro: sem isto ela
    // congela com PV e espaços de magia velhos enquanto o combate anda.
    if (this.ficha?.estaAberta()) this.ficha.atualizar();
    if (this.recusa) {
      this.hud.setHint(`✖ ${this.recusa}`);
      this.recusa = null;
    } else if (!this.mode) {
      this.hud.setHint(c ? `${c.name} — clique num quadrado azul para mover, ou escolha uma ação.` : '');
    } else if (magia && c) {
      this.hud.setHint(this.dicaDaMagia(c, magia));
    }
    // Explorando a estrada: não há turno nem rodada, há um grupo andando.
    if (this.capitulo?.explorando) {
      this.hud.banner.textContent = `Exploração · ${this.capitulo.lugar ?? 'Trilha de Triboar'}`;
      if (!this.recusa) this.hud.setHint(c ? `${c.name} — clique no chão para andar. Clique em outro herói para trocar.` : '');
    }
  }

  // ---- layout ------------------------------------------------------------------

  /**
   * Tira a coluna da direita do caminho do tabuleiro (`view/layout.css`): o
   * minimapa sai, as rolagens viram uma gaveta aberta pelo botão "Registro",
   * e o aviso legal vira uma linha embaixo. Os elementos são os
   * mesmos que o HUD criou e atualiza; só mudam de lugar.
   */
  montarLayoutLivre(topoEsquerda) {
    const root = this.root;
    const coluna = root.querySelector('.coluna-log');
    const palco = root.querySelector('.palco');
    if (!coluna || !palco) return;
    root.classList.add('layout-livre');

    // O minimapa sai da tela: o tabuleiro já mostra o mapa inteiro. O HUD
    // continua atualizando o elemento, só que fora do documento.
    this.hud.minimapaHost.remove();
    const legal = coluna.querySelector('.legal');
    if (legal) { legal.classList.add('legal-rodape'); palco.append(legal); }
    coluna.classList.add('gaveta-registro');
    palco.append(coluna);

    const novidades = document.createElement('span');
    novidades.className = 'novidades';
    const botao = document.createElement('button');
    botao.className = 'btn btn-registro';
    botao.title = 'Rolagens e acontecimentos';
    botao.append('Registro', novidades);
    this.novidadesNoRegistro = 0;
    this.alternarRegistro = (abrir = !coluna.classList.contains('aberta')) => {
      coluna.classList.toggle('aberta', abrir);
      botao.classList.toggle('aberto', abrir);
      if (abrir) { this.novidadesNoRegistro = 0; novidades.textContent = ''; }
    };
    botao.addEventListener('click', () => { audio.play('click'); this.alternarRegistro(); });
    // Conta o que chegou com a gaveta fechada, para o jogador saber que há
    // rolagem nova sem precisar abrir.
    this.contarNovidade = () => {
      if (coluna.classList.contains('aberta')) return;
      this.novidadesNoRegistro += 1;
      novidades.textContent = this.novidadesNoRegistro > 99 ? '99+' : String(this.novidadesNoRegistro);
    };
    topoEsquerda.insertBefore(botao, this.hud.banner);
  }

  // ---- botão direito ---------------------------------------------------------

  /** O menu de ações da casa clicada (`game/interacoes.js`). */
  abrirContexto(tile, e) {
    if (!this.enc || this.ficha?.estaAberta() || narrativaAberta() || this.menu?.estaAberto()) return;
    const m = opcoesDaCasa(this, tile);
    if (!m?.opcoes.length) return;
    this.mode = null;
    this.refresh();
    abrirMenuContexto(this.root, {
      x: e.clientX, y: e.clientY, ...m,
      // Passar o mouse numa ação acende o alvo dela no tabuleiro.
      aoPrevia: (o) => this.board?.setOverlay({ targets: o?.alvoPrevia ? [o.alvoPrevia] : null }),
    });
  }

  /** Um texto curto no painel de narrativa, sem escolha (Olhar, Examinar). */
  mostrarTexto(titulo, texto) {
    narrar(this.root, { formato: 'painel', paginas: [{ titulo, texto: [].concat(texto) }] });
  }

  /**
   * Conversa com um NPC. Com árvore de diálogo (dele ou da cena), as escolhas
   * e os testes de `game/dialogo.js`, e o fim vai para a cena; sem árvore, as
   * falas soltas dele, uma por página.
   */
  async conversar(npc) {
    if (narrativaAberta()) return;
    const arvore = npc.dialogo ?? this.capitulo?.dialogoDe?.(npc);
    if (arvore) {
      const fim = await conversarComArvore(this, npc, arvore);
      this.capitulo?.depoisDaConversa?.(npc, fim);
      this.refresh();
      return;
    }
    const falas = npc.falas ?? [npc.frase ?? `${npc.name} olha para vocês e não diz nada.`];
    narrar(this.root, { formato: 'painel', paginas: falas.map((f) => ({ texto: [{ nome: `${npc.name}:`, texto: f }] })) });
  }

  /** Conversa com árvore dada pela cena, sem passar pelo botão direito. */
  conversarCom(npc, arvore) {
    return conversarComArvore(this, npc, arvore);
  }

  /** Descanso do grupo, pelo menu do botão direito, fora da luta. */
  async descansar(tipo) {
    if (narrativaAberta()) return;
    const herois = this.enc.combatants.filter((c) => c.side === 'party' && !c.dead);
    const linhas = tipo === 'longo'
      // Na estrada, quem passou o dia sem comer ou sem beber dorme, mas não
      // desfaz degrau de exaustão (`rules/mantimentos.js`).
      ? await descansoLongoDoGrupo(this.root, {
        herois,
        texto: this.capitulo?.textoDoDescanso?.('longo'),
        // O livro pede "alguma comida e bebida": meia ração é alguma comida,
        // então meio dia sem comer (0,5) ainda deixa o descanso desfazer um
        // degrau. Um dia inteiro sem nada, não.
        alimentado: (c) => (c.diasSemComida ?? 0) < 1 && !c.semAgua,
      })
      : await descansoCurto(this.root, { herois, rng: this.enc.rng, texto: this.capitulo?.textoDoDescanso?.('curto') });
    for (const t of linhas) this.enc.say('cura', t);
    // O descanso é tempo de verdade: as magias de duração correm (uma hora, oito horas).
    for (const t of avancarTempo(estadoDeUtilidade(this.campanha ??= {}), tipo === 'longo' ? 480 : 60, herois)) this.enc.say('magia', t);
    this.capitulo?.depoisDoDescanso?.(tipo);
    this.refresh();
  }

  /** Conjura uma magia de utilidade fora do combate (menu, barra de magias, conversa). */
  conjurarFora(c, spellId, opts = {}) {
    return conjurarComTela(this, c, spellId, opts);
  }

  /** O tempo passa; as magias de duração correm. */
  esperar(minutos) {
    return esperarTempo(this, minutos);
  }

  /** Acende ou apaga a tocha. Acender no meio da luta custa a ação. */
  alternarTocha(c) {
    const acender = !c.tochaAcesa;
    c.tochaAcesa = acender;
    if (acender && !this.capitulo?.explorando && this.enc.side === 'party') c.actionUsed = true;
    this.enc.say('acao', acender
      ? `${c.name} acende uma tocha: luz em 20 pés ao redor, e quem está no escuro agora vê de onde ela vem.`
      : `${c.name} apaga a tocha.`);
    this.refresh();
  }

  /** Usar item pelo menu: a mesma porta do clique na barra. */
  usarItem(c, itemId, alvo) {
    const r = this.enc.useItem(c, itemId, { target: alvo });
    if (!r.ok) { this.refuse(c, r.why); return; }
    this.afterAct();
  }

  /**
   * Sai do tabuleiro para a vila de Phandalin (capítulo 3), com o grupo. A
   * vila é uma tela própria (`game/phandalin.js`); o tabuleiro volta só para
   * as lutas.
   */
  irParaVila(grupo, { chegando = false } = {}) {
    fecharMenuContexto();
    this.capitulo = null;
    this.enc = null;
    this.board = null;
    this.selected = null;
    this.mode = null;
    this.root.classList.remove('explorando');
    return abrirPhandalin(this, { grupo, chegando });
  }

  /** Sai do tabuleiro para o mapa da região, com o grupo parado em `onde`. */
  irParaRegiao(grupo, onde = 'phandalin') {
    fecharMenuContexto();
    this.capitulo = null;
    this.enc = null;
    this.board = null;
    this.selected = null;
    this.mode = null;
    this.root.classList.remove('explorando');
    return abrirRegiao(this, { grupo, onde });
  }

  /** Fim do capítulo (ou desistência): sai da partida e volta ao menu. */
  /** A ficha aberta na vila, por cima dela; `aoFechar` redesenha a vila. */
  abrirFichaNaVila(heroi, aoFechar) {
    this._aoFecharFicha = aoFechar;
    this.ficha.abrir(heroi, 'inventario');
    document.querySelector('.ficha-overlay')?.classList.add('na-vila');
  }

  encerrarPartida() {
    fecharMenuContexto();
    this.capitulo = null;
    this.enc = null;
    this.board = null;
    this.selected = null;
    this.mode = null;
    this.root.classList.remove('explorando');
    this.menu.abrir();
  }
}

const app = new App(document.getElementById('app'));

// Em desenvolvimento, dá para dirigir o combate pelo console:
//   __app.enc            estado do encontro
//   __app.autoPlay()     joga o grupo sozinho até o fim (teste de fumaça)
if (import.meta.env?.DEV) {
  window.__app = app;
  // A política do grupo mora em dev/balance.js, junto do simulador de
  // equilíbrio — uma cópia só, para as duas não saírem do lugar.
  let playCharacter = null;

  app.autoPlay = async (maxRounds = 25) => {
    playCharacter ??= (await import('./dev/balance.js')).playCharacter;
    while (!app.enc.over && app.enc.round <= maxRounds) {
      if (app.enc.side !== 'party') { await new Promise((r) => setTimeout(r, 60)); continue; }
      const pending = app.enc.allOf('party').filter((c) => !c.acted && !c.dead && !hasCondition(c, 'inconsciente'));
      if (pending.length === 0) { await new Promise((r) => setTimeout(r, 60)); continue; }
      playCharacter(app.enc, pending[0]);
      await new Promise((r) => setTimeout(r, 25));
    }
    app.refresh();
    return { over: app.enc.over, outcome: app.enc.outcome, round: app.enc.round, entries: app.enc.log.length };
  };
}
