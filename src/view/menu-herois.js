// As duas telas entre a escolha da aventura e o tabuleiro.
//
//   grupo     os doze heróis prontos; o jogador põe quatro na carroça. Daqui
//             dá para jogar direto com as escolhas automáticas, ou preparar
//   preparo   cada um dos quatro, numa aba: subclasse (quando a classe tem uma
//             no 1º nível), talento de origem, magias e equipamento inicial
//
// As regras e as listas moram em `game/criacao.js`; esta tela só mostra e
// guarda o que o jogador marcou. Toda opção que o motor ainda não joga aparece
// com a marca "sem regra ainda": dá para escolher, a escolha fica guardada na
// ficha, mas não muda o combate até a regra existir — melhor dizer isso na
// hora do que deixar o jogador descobrir no meio da luta.

import { el } from './hud.js';
import { maxHpEfetivo } from '../rules/conditions.js';
import { audio } from '../core/audio.js';
import { nomeDeId } from '../rules/equipment.js';
import { lerCriados, guardarCriado, apagarCriado } from '../game/herois-criados.js';
import { heroiPorId, registrarHeroi } from '../game/herois.js';
import {
  novoRascunho, trocarClasse, problemasDoRascunho, definicaoDoRascunho, rascunhoDaDefinicao, atributosFinais, custoDosPontos,
  periciasDaClasse, periciasFixas, sugerirPericias, padraoDaClasse, nomeDaRaca, nomeDaClasse, novoId,
  ATRIBUTOS, CONJUNTO_PADRAO, CUSTO_DO_PONTO, PONTOS, ANTECEDENTES, RACAS_DO_CRIADOR, CORES_DO_DRACONATO, MAX_NOME, MAX_HISTORIA,
  SKILL_NAME, ABILITY_NAME, LIVRES_DA_RACA, talentosDoVariante,
} from '../game/criador.js';
import { infoDoTalentoPhb, TALENTOS_PHB, NOME_DO_ATRIBUTO } from '../rules/talentos-phb.js';
import { CLASSES } from '../rules/classes/index.js';
import { RACAS, ANCESTRALIDADES_DRACONICAS } from '../rules/racas.js';
import { abilityMod } from '../rules/abilities.js';
import { formatModifier as formatarMod } from '../core/dice.js';
import { lerImagem, desenharRecorte, reduzirArte } from './arte-upload.js';
import { registrarArte } from '../art/arte-propria.js';
import {
  HEROIS, montarHeroi, escolhaAutomatica, problemasDaEscolha, regrasDeMagia,
  SUBCLASSES_1, TALENTOS_DE_ORIGEM, EQUIPAMENTO_1, nomeDaMagia, magiaTemRegra, nomeDoPacote,
  LISTAS_DO_INICIADO, escolhaDoIniciado, origemEmConflito,
} from '../game/criacao.js';

const GRUPO = 4;   // a carroça leva quatro, e o mapa tem quatro lugares de partida

/** Os prontos e os criados, nesta ordem. Ler os criados também os registra no jogo. */
const todosOsHerois = () => [...HEROIS, ...lerCriados()];

const semRegra = () => el('small', { class: 'menu-sem-regra', title: 'Fica guardado na ficha, mas ainda não muda o combate.' }, 'sem regra ainda');
const foraDoCombate = () => el('small', { class: 'menu-sem-regra', title: 'O efeito é de loja e ofício, que o jogo ainda não tem.' }, 'fora do combate');

export function criarTelasDeHerois({ botao, voltarBtn, cabecalho, ir, iniciar, retratoDe }) {
  // A escolha do grupo sobrevive a ir e voltar entre as telas.
  const grupo = { escolhidos: [], foco: HEROIS[0].id };

  /** Retrato com recuo: quadro vazio enquanto a folha carrega. */
  function retrato(look, aoFaltar) {
    const r = retratoDe(look);
    if (r) return r;
    aoFaltar();
    return el('canvas', { width: 48, height: 48, class: 'pixel' });
  }

  // ------------------------------------------------------------- grupo ----
  function telaGrupo({ aventura }) {
    const lista = el('div', { class: 'menu-doze' });
    const detalhe = el('article', { class: 'menu-heroi-detalhe' });
    const contagem = el('span', { class: 'menu-contagem' });
    const pronto = botao('Começar já, com as escolhas padrão', () => comecar(true));
    const preparar = botao('Personalizar os heróis', () => comecar(false), { primario: true });

    function comecar(automatico) {
      const ids = todosOsHerois().map((h) => h.id).filter((id) => grupo.escolhidos.includes(id));
      const escolhas = Object.fromEntries(ids.map((id) => [id, escolhaAutomatica(id)]));
      if (automatico) iniciar(configDaCampanha(aventura, ids, escolhas));
      else ir('preparo', { aventura, ids, escolhas, aba: ids[0] });
    }

    let tentativas = 0;
    function redesenhar() {
      let faltou = false;
      const todos = todosOsHerois();
      // um herói criado que foi apagado sai do grupo e do foco
      grupo.escolhidos = grupo.escolhidos.filter((id) => todos.some((h) => h.id === id));
      if (!todos.some((h) => h.id === grupo.foco)) grupo.foco = HEROIS[0].id;
      const criar = el('button', {
        class: 'menu-heroi compacto menu-heroi-criar',
        title: 'Faça o seu: nome, raça, classe, antecedente, atributos e a imagem da ficha.',
        onclick: () => { audio.play('click'); ir('criar', { aventura }); },
      },
      el('span', { class: 'menu-heroi-retrato menu-heroi-mais' }, '+'),
      el('span', { class: 'menu-heroi-nome' }, 'Criar herói'),
      el('span', { class: 'menu-heroi-classe' }, 'o seu, do zero'));
      // Todos entram na carroça: o tabuleiro de cima desenha o retrato na ficha, e os doze têm retrato (até
      // 2026-11-05 só entrava quem tinha a folha animada do PixelLab).
      lista.replaceChildren(criar, ...todos.map((h) => {
        const marcado = grupo.escolhidos.includes(h.id);
        return el('button', {
          class: `menu-heroi compacto${marcado ? ' escolhido' : ''}${grupo.foco === h.id ? ' foco' : ''}`,
          'aria-pressed': String(marcado),
          onclick: () => {
            audio.play('click');
            if (grupo.foco !== h.id) grupo.foco = h.id;
            else if (marcado) grupo.escolhidos = grupo.escolhidos.filter((i) => i !== h.id);
            else if (grupo.escolhidos.length < GRUPO) grupo.escolhidos.push(h.id);
            redesenhar();
          },
        },
        el('span', { class: 'menu-heroi-retrato' }, retrato(h.look, () => { faltou = true; })),
        el('span', { class: 'menu-heroi-nome' }, h.name),
        el('span', { class: 'menu-heroi-classe' }, `${h.className} · ${h.raca}`),
        el('span', { class: 'menu-heroi-marca' }, marcado ? 'No grupo' : ''));
      }));

      const h = todos.find((x) => x.id === grupo.foco);
      const ficha = montarHeroi(h.id);
      const marcado = grupo.escolhidos.includes(h.id);
      const tracos = [['Traço', h.traco], ['Ideal', h.ideal], ['Vínculo', h.vinculo], ['Defeito', h.defeito]].filter(([, v]) => v);
      detalhe.replaceChildren(...[
        el('header', {},
          el('h3', {}, h.name),
          el('p', { class: 'menu-heroi-linha' }, `${h.className}, ${h.raca.toLowerCase()}, nível 1 · ${h.antecedente}`),
          el('p', { class: 'menu-heroi-numeros' }, `PV ${maxHpEfetivo(ficha)} · CA ${ficha.ac} · Deslocamento ${h.speedFt} pés`)),
        h.origem && el('p', { class: 'menu-heroi-origem' }, h.origem),
        ...(h.historia ?? []).map((p) => el('p', {}, p)),
        h.motivo && el('p', { class: 'menu-heroi-motivo' }, el('strong', {}, 'Por que está na estrada. '), h.motivo),
        tracos.length > 0 && el('dl', { class: 'menu-heroi-tracos' }, ...tracos.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])),
        h.criado && el('div', { class: 'menu-linha-equip' },
          botao('Editar', () => ir('criar', { aventura, editar: h })),
          botao('Apagar', () => {
            if (!globalThis.confirm?.(`Apagar ${h.name}? As partidas que já o levam continuam com ele.`)) return;
            apagarCriado(h.id);
            redesenhar();
          })),
        // O botão faz o mesmo que o segundo clique no retrato, só que visível: quem lê a história vê o que fazer a seguir.
        botao(marcado ? 'Tirar do grupo' : 'Pôr no grupo', () => {
          if (marcado) grupo.escolhidos = grupo.escolhidos.filter((i) => i !== h.id);
          else if (grupo.escolhidos.length < GRUPO) grupo.escolhidos.push(h.id);
          redesenhar();
        }, { primario: !marcado, desabilitado: !marcado && grupo.escolhidos.length >= GRUPO, dica: marcado ? null : 'O grupo já tem quatro: tire alguém para pôr este.' }),
        el('p', { class: 'menu-dica' }, 'Começar já usa as escolhas padrão de cada herói; Personalizar deixa mudar talentos, perícias e equipamento antes de partir.'),
      ].filter(Boolean));

      const n = grupo.escolhidos.length;
      contagem.textContent = `${n} de ${GRUPO} escolhidos`;
      pronto.disabled = n !== GRUPO;
      preparar.disabled = n !== GRUPO;
      if (faltou && tentativas++ < 20) setTimeout(() => { if (lista.isConnected) redesenhar(); }, 500);
    }
    redesenhar();

    return el('div', {},
      cabecalho(aventura.tituloPt ?? aventura.titulo, 'Escolha os quatro que vão na carroça. Clique num herói para ler a história dele, e de novo para pô-lo no grupo.'),
      el('div', { class: 'menu-herois-corpo' }, lista, detalhe),
      el('div', { class: 'menu-rodape' }, voltarBtn(), contagem, pronto, preparar));
  }

  // ------------------------------------------------------------- criar ----
  /**
   * O CRIADOR (`game/criador.js`): nome, gênero, raça, classe, antecedente, atributos, perícias, a imagem da ficha e
   * uma história curta. Salvar põe o herói no rol do navegador e volta ao grupo com ele já escolhido. O talento, as
   * magias e o equipamento são da tela de preparo, como para os prontos.
   */
  function telaCriar(estado) {
    const { aventura, editar } = estado;
    const r = editar ? rascunhoDaDefinicao(editar) : (estado.rascunho ?? novoRascunho());
    estado.rascunho = r;
    const corpo = el('div', { class: 'menu-preparo' });
    const resumo = el('aside', { class: 'menu-preparo-resumo' });
    const avisos = el('span', { class: 'menu-contagem' });
    const salvar = botao(editar ? 'Salvar as mudanças' : 'Salvar o herói', guardar, { primario: true });
    let original = null;            // a imagem enviada, inteira, para mexer no recorte
    const ajuste = { zoom: 1, dx: 0, dy: 0 };

    // os campos de texto ficam fora do corpo redesenhado: redesenhar a cada letra tiraria o foco
    const campoNome = el('input', { type: 'text', maxlength: String(MAX_NOME), value: r.nome, placeholder: 'Como o grupo vai chamar', class: 'menu-campo' });
    campoNome.addEventListener('input', () => { r.nome = campoNome.value; atualizarResumo(); });
    const campoHistoria = el('textarea', { rows: '3', maxlength: String(MAX_HISTORIA), class: 'menu-campo', placeholder: 'De onde vem, por que está na estrada (opcional)' });
    campoHistoria.value = r.historia ?? '';
    campoHistoria.addEventListener('input', () => { r.historia = campoHistoria.value; atualizarResumo(); });

    // a imagem: arquivo, o recorte no anel, zoom e deslocamento
    const previa = el('canvas', { width: 160, height: 160, class: 'menu-criar-previa' });
    const entrada = el('input', { type: 'file', accept: 'image/*', hidden: true });
    const erroDaImagem = el('p', { class: 'menu-aviso', hidden: true });
    const deslizante = (rotulo, campo, min, max) => {
      const d = el('input', { type: 'range', min: String(min), max: String(max), step: '0.01', value: String(ajuste[campo]) });
      d.addEventListener('input', () => { ajuste[campo] = Number(d.value); refazerArte(); });
      return el('label', { class: 'menu-criar-ajuste' }, rotulo, d);
    };
    const ajustes = el('div', { class: 'menu-criar-ajustes', hidden: true },
      deslizante('zoom', 'zoom', 1, 3), deslizante('←→', 'dx', -1, 1), deslizante('↑↓', 'dy', -1, 1));
    entrada.addEventListener('change', async () => {
      erroDaImagem.hidden = true;
      try {
        original = await lerImagem(entrada.files?.[0]);
        Object.assign(ajuste, { zoom: 1, dx: 0, dy: 0 });
        for (const d of ajustes.querySelectorAll('input')) d.value = d.min === '1' ? '1' : '0';
        ajustes.hidden = false;
        refazerArte();
      } catch (e) {
        erroDaImagem.textContent = e.message;
        erroDaImagem.hidden = false;
      }
      entrada.value = '';
    });
    const tirarImagem = botao('Tirar a imagem', () => { original = null; r.arte = null; ajustes.hidden = true; pintarPrevia(); atualizarResumo(); });

    function refazerArte() {
      if (!original) return;
      r.arte = reduzirArte(original, ajuste);
      if (!r.arte) { erroDaImagem.textContent = 'Não deu para reduzir a imagem o bastante.'; erroDaImagem.hidden = false; }
      pintarPrevia();
      atualizarResumo();
    }

    /** A ficha como o tabuleiro vai mostrar: a imagem no disco e o anel do grupo por fora. */
    function pintarPrevia() {
      const ctx = previa.getContext('2d');
      const p = previa.width;
      const raio = p * 0.42;
      ctx.clearRect(0, 0, p, p);
      ctx.save();
      ctx.beginPath(); ctx.arc(p / 2, p / 2, raio, 0, Math.PI * 2); ctx.closePath();
      ctx.fillStyle = '#3b3326';
      ctx.fill();
      ctx.clip();
      if (original) {
        const tmp = el('canvas', { width: String(Math.round(raio * 2)), height: String(Math.round(raio * 2)) });
        desenharRecorte(tmp, original, ajuste);
        ctx.drawImage(tmp, p / 2 - raio, p / 2 - raio, raio * 2, raio * 2);
      } else if (r.arte) {
        const img = new Image();
        img.onload = () => pintarPrevia();
        if (!previa._arte || previa._arte.src !== r.arte) { previa._arte = img; img.src = r.arte; }
        const pronta = previa._arte;
        if (pronta.complete && pronta.naturalWidth) ctx.drawImage(pronta, p / 2 - raio, p / 2 - raio, raio * 2, raio * 2);
      } else {
        ctx.fillStyle = '#e9dcbc';
        ctx.font = `600 ${Math.round(raio)}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(([...(r.nome || '?')][0] ?? '?').toUpperCase(), p / 2, p / 2 + 4);
      }
      ctx.restore();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#d9b45a';
      ctx.beginPath(); ctx.arc(p / 2, p / 2, raio, 0, Math.PI * 2); ctx.stroke();
    }

    function secao(titulo, sub, ...filhos) {
      return el('section', { class: 'menu-secao' }, el('h4', {}, titulo, sub && el('small', {}, sub)), ...filhos.filter(Boolean));
    }
    const chip = (rotulo, marcado, aoClicar, { titulo, desligado } = {}) => el('button', {
      class: `menu-chip${marcado ? ' marcada' : ''}`, title: titulo ?? null, disabled: desligado ? true : null,
      onclick: () => { audio.play('click'); aoClicar(); redesenhar(); },
    }, rotulo);

    function secaoRaca() {
      const raca = RACAS[r.raca];
      const bonus = Object.entries(raca.atributos ?? {}).map(([a, v]) => `${ABILITY_NAME[a]} +${v}`).join(', ');
      return secao('Raça', nomeDaRaca(r.raca, r.sexo, r.cor),
        el('div', { class: 'menu-chips' }, ...RACAS_DO_CRIADOR.map((id) => chip(nomeDaRaca(id, r.sexo, r.cor).replace(/ (vermelh[oa]|negr[oa]|branc[oa]|azul|verde|de \w+)$/, ''), r.raca === id, () => {
          r.raca = id;
          r.periciasEscolhidas = sugerirPericias(r);
        }))),
        r.raca === 'draconato' && el('div', { class: 'menu-chips' }, ...CORES_DO_DRACONATO.map((cor) => chip(
          `${ANCESTRALIDADES_DRACONICAS[cor].dragao} (${ANCESTRALIDADES_DRACONICAS[cor].dano})`, r.cor === cor, () => { r.cor = cor; }))),
        el('p', { class: 'menu-dica' }, `${bonus || 'Sem bônus fixo'} · deslocamento ${raca.deslocamento} pés${raca.visao ? ` · visão no escuro ${raca.visao / 3.28 | 0} m` : ''}.`));
    }

    function secaoClasse() {
      return secao('Classe', nomeDaClasse(r.classe, r.sexo),
        el('div', { class: 'menu-chips' }, ...Object.keys(CLASSES).map((id) => chip(nomeDaClasse(id, r.sexo), r.classe === id, () => trocarClasse(r, id)))));
    }

    function secaoAntecedente() {
      return secao('Antecedente', 'do SRD 5.2',
        el('div', { class: 'menu-opcoes-cartao' }, ...Object.entries(ANTECEDENTES).map(([id, a]) => el('button', {
          class: `menu-opcao-cartao${r.antecedente === id ? ' marcada' : ''}`,
          onclick: () => { audio.play('click'); r.antecedente = id; r.periciasEscolhidas = sugerirPericias(r); redesenhar(); },
        }, el('strong', {}, r.sexo === 'F' ? a.nomeF : a.nome), el('span', {}, `${a.resumo} ${a.pericias.map((s) => SKILL_NAME[s]).join(' e ')}.`)))));
    }

    function secaoAtributos() {
      const finais = atributosFinais(r);
      const bonus = RACAS[r.raca].atributos ?? {};
      const linhas = ATRIBUTOS.map((a) => {
        let controle;
        if (r.metodo === 'padrao') {
          // escolher um valor que outro atributo tem TROCA os dois: o conjunto continua inteiro
          const sel = el('select', { class: 'menu-campo' }, ...CONJUNTO_PADRAO.map((v) => el('option', { value: String(v), selected: r.base[a] === v ? true : null }, String(v))));
          sel.addEventListener('change', () => {
            const v = Number(sel.value);
            const outro = ATRIBUTOS.find((b) => b !== a && r.base[b] === v);
            if (outro) r.base[outro] = r.base[a];
            r.base[a] = v;
            redesenhar();
          });
          controle = sel;
        } else {
          const muda = (d) => { const v = r.base[a] + d; if (v >= 8 && v <= 15) { r.base[a] = v; redesenhar(); } };
          controle = el('span', { class: 'menu-criar-pontos' },
            el('button', { class: 'menu-chip', onclick: () => muda(-1), disabled: r.base[a] <= 8 ? true : null }, '−'),
            el('b', {}, String(r.base[a])),
            el('button', { class: 'menu-chip', onclick: () => muda(1), disabled: r.base[a] >= 15 || custoDosPontos({ ...r.base, [a]: r.base[a] + 1 }) > PONTOS ? true : null }, '+'));
        }
        const extra = (bonus[a] ?? 0) + (LIVRES_DA_RACA[r.raca] && r.livres.includes(a) ? 1 : 0);
        return el('div', { class: 'menu-criar-atributo' },
          el('span', {}, ABILITY_NAME[a]), controle,
          el('small', {}, extra ? `+${extra}` : ''),
          el('strong', {}, `${finais[a]} (${formatarMod(abilityMod(finais[a]))})`));
      });
      return secao('Atributos', r.metodo === 'pontos' ? `${custoDosPontos(r.base)} de ${PONTOS} pontos` : 'conjunto padrão',
        el('div', { class: 'menu-chips' },
          chip('Conjunto padrão', r.metodo === 'padrao', () => { r.metodo = 'padrao'; r.base = padraoDaClasse(r.classe); }),
          chip('Compra de pontos', r.metodo === 'pontos', () => { r.metodo = 'pontos'; r.base = Object.fromEntries(ATRIBUTOS.map((a) => [a, 8])); })),
        ...linhas,
        LIVRES_DA_RACA[r.raca] && el('p', { class: 'menu-dica' }, `${r.raca === 'meioElfo' ? 'Meio-elfo' : 'Humano variante'}: +1 em dois atributos à escolha (${r.livres.length} de 2).`),
        LIVRES_DA_RACA[r.raca] && el('div', { class: 'menu-chips' }, ...ATRIBUTOS.filter((a) => !(LIVRES_DA_RACA[r.raca].semCarisma && a === 'cha')).map((a) => chip(ABILITY_NAME[a], r.livres.includes(a), () => {
          if (r.livres.includes(a)) r.livres = r.livres.filter((x) => x !== a);
          else if (r.livres.length < 2) r.livres = [...r.livres, a];
        }))));
    }

    function secaoPericias() {
      const { quantas, de } = periciasDaClasse(r.classe);
      const fixas = periciasFixas(r);
      const marcar = (lista, s, teto) => (lista.includes(s) ? lista.filter((x) => x !== s) : lista.length < teto ? [...lista, s] : lista);
      return secao('Perícias', `${r.periciasEscolhidas.length} de ${quantas} da classe`,
        fixas.length > 0 && el('p', { class: 'menu-dica' }, `Já vêm: ${fixas.map((s) => SKILL_NAME[s]).join(', ')} (antecedente e raça).`),
        el('div', { class: 'menu-chips' }, ...de.filter((s) => !fixas.includes(s)).map((s) => chip(SKILL_NAME[s], r.periciasEscolhidas.includes(s),
          () => { r.periciasEscolhidas = marcar(r.periciasEscolhidas, s, quantas); }))),
        LIVRES_DA_RACA[r.raca] && el('p', { class: 'menu-dica' }, r.raca === 'meioElfo'
          ? `Meio-elfo: duas perícias quaisquer (${r.periciasLivres.length} de 2).`
          : `Humano variante: uma perícia qualquer (${r.periciasLivres.length} de 1).`),
        LIVRES_DA_RACA[r.raca] && el('div', { class: 'menu-chips' }, ...Object.keys(SKILL_NAME)
          .filter((s) => !fixas.includes(s) && !r.periciasEscolhidas.includes(s))
          .map((s) => chip(SKILL_NAME[s], r.periciasLivres.includes(s), () => { r.periciasLivres = marcar(r.periciasLivres, s, LIVRES_DA_RACA[r.raca].pericias); }))));
    }

    /** O talento do HUMANO VARIANTE: um do Livro do Jogador, já no 1º nível. O que o herói não pode tomar fica apagado, com o motivo. */
    function secaoTalentoVariante() {
      if (r.raca !== 'humanoVariante') return null;
      const lista = talentosDoVariante(r);
      const escolhido = r.talentoVariante?.id ? infoDoTalentoPhb(r.talentoVariante.id) : null;
      const atributos = TALENTOS_PHB[r.talentoVariante?.id]?.atributo;
      return secao('Talento do humano variante', escolhido ? escolhido.nome : 'escolha um',
        el('p', { class: 'menu-dica' }, 'Um talento do Livro do Jogador no 1º nível, além do talento de origem que vem na tela de preparo.'),
        el('div', { class: 'menu-opcoes-cartao' }, ...lista.map(({ id, motivo }) => {
          const info = infoDoTalentoPhb(id);
          return el('button', {
            class: `menu-opcao-cartao${r.talentoVariante?.id === id ? ' marcada' : ''}`, disabled: motivo ? true : null, title: motivo ?? info.desc,
            onclick: () => { audio.play('click'); r.talentoVariante = { id }; redesenhar(); },
          }, el('strong', {}, info.nome), el('span', {}, motivo ? `Não pode: ${motivo}.` : info.noJogo));
        })),
        Array.isArray(atributos) && atributos.length > 1 && el('div', { class: 'menu-chips' }, ...atributos.map((a) => chip(`+1 ${NOME_DO_ATRIBUTO[a]}`,
          r.talentoVariante.atributo === a, () => { r.talentoVariante = { ...r.talentoVariante, atributo: a }; }))));
    }

    function atualizarResumo() {
      const problemas = problemasDoRascunho(r);
      const finais = atributosFinais(r);
      let numeros = null;
      if (!problemas.length) {
        // a ficha de verdade, montada pelo motor, de um herói de prévia
        const def = definicaoDoRascunho(r, 'pc-criado-previa');
        registrarHeroi(def);
        const c = montarHeroi(def.id);
        numeros = el('dl', { class: 'menu-resumo-numeros' },
          el('dt', {}, 'PV'), el('dd', {}, maxHpEfetivo(c)),
          el('dt', {}, 'CA'), el('dd', {}, c.ac),
          el('dt', {}, 'Arma'), el('dd', {}, nomeDeId(c.weapons[0])),
          el('dt', {}, 'Perícias'), el('dd', {}, def.skills.map((s) => SKILL_NAME[s]).join(', ')));
      }
      resumo.replaceChildren(...[
        previa,
        el('div', { class: 'menu-linha-equip' }, botao(r.arte ? 'Trocar a imagem' : 'Mandar uma imagem', () => entrada.click()), r.arte && tirarImagem),
        entrada, ajustes, erroDaImagem,
        el('p', { class: 'menu-dica' }, 'A imagem vai recortada no círculo, e o jogo põe o anel em volta. Fica guardada só neste navegador e nos saves.'),
        el('h3', {}, r.nome.trim() || 'Sem nome'),
        el('p', { class: 'menu-heroi-linha' }, `${nomeDaClasse(r.classe, r.sexo)}, ${nomeDaRaca(r.raca, r.sexo, r.cor).toLowerCase()}`),
        el('p', { class: 'menu-dica' }, ATRIBUTOS.map((a) => `${a === 'str' ? 'FOR' : a === 'dex' ? 'DES' : a === 'con' ? 'CON' : a === 'int' ? 'INT' : a === 'wis' ? 'SAB' : 'CAR'} ${finais[a]}`).join(' · ')),
        numeros,
        ...problemas.map((p) => el('p', { class: 'menu-aviso' }, p)),
      ].filter(Boolean));
      if (!original) pintarPrevia();
      avisos.textContent = problemas.length ? `Falta ${problemas.length === 1 ? 'uma coisa' : `${problemas.length} coisas`}` : 'Pronto para salvar';
      salvar.disabled = problemas.length > 0;
    }

    function redesenhar() {
      corpo.replaceChildren(
        secao('Nome', null, campoNome,
          el('div', { class: 'menu-chips' }, chip('Ela', r.sexo === 'F', () => { r.sexo = 'F'; }), chip('Ele', r.sexo === 'M', () => { r.sexo = 'M'; }))),
        secaoRaca(), secaoClasse(), secaoAntecedente(), secaoAtributos(), secaoPericias(), secaoTalentoVariante(),
        secao('História', 'opcional', campoHistoria),
      );
      atualizarResumo();
    }

    function guardar() {
      if (problemasDoRascunho(r).length) return;
      const def = definicaoDoRascunho(r, editar?.id ?? novoId());
      const res = guardarCriado(def);
      if (!res.ok) { avisos.textContent = res.erro; return; }
      registrarArte(def.look, def.arte, def.name);
      grupo.foco = def.id;
      if (!grupo.escolhidos.includes(def.id) && grupo.escolhidos.length < GRUPO) grupo.escolhidos.push(def.id);
      estado.rascunho = null;
      ir('grupo', { aventura });
    }

    redesenhar();
    return el('div', {},
      cabecalho(editar ? `Editar ${editar.name}` : 'Criar herói', 'Raça, classe, antecedente, atributos, perícias e a imagem da ficha. Talento, magias e equipamento vêm na tela de preparo, como para os prontos.'),
      el('div', { class: 'menu-preparo-corpo' }, corpo, resumo),
      el('div', { class: 'menu-rodape' }, voltarBtn(), avisos, salvar));
  }

  // ----------------------------------------------------------- preparo ----
  function telaPreparo(estado) {
    const { aventura, ids, escolhas } = estado;
    const abas = el('nav', { class: 'menu-abas' });
    const corpo = el('div', { class: 'menu-preparo' });
    const resumo = el('aside', { class: 'menu-preparo-resumo' });
    const avisos = el('span', { class: 'menu-contagem' });
    const comecar = botao('Começar a aventura', () => iniciar(configDaCampanha(aventura, ids, escolhas)), { primario: true });
    const todosAuto = botao('Automático para todos', () => {
      for (const id of ids) escolhas[id] = escolhaAutomatica(id);
      redesenhar();
    });

    function redesenhar() {
      const id = estado.aba;
      const h = heroiPorId(id);
      const e = escolhas[id];

      abas.replaceChildren(...ids.map((i) => {
        const hh = heroiPorId(i);
        const ok = problemasDaEscolha(i, escolhas[i]).length === 0;
        return el('button', {
          class: `menu-aba${i === id ? ' ativa' : ''}${ok ? '' : ' pendente'}`,
          onclick: () => { audio.play('click'); estado.aba = i; redesenhar(); },
        },
        el('span', { class: 'menu-heroi-retrato mini' }, retrato(hh.look, () => {})),
        el('span', {}, hh.name),
        el('small', {}, ok ? 'pronto' : 'falta escolher'));
      }));

      corpo.replaceChildren(...[
        secaoSubclasse(h, e),
        secaoTalento(e, h),
        secaoIniciado(h, e),
        ...secoesDeMagia(h, e),
        secaoEquipamento(h, e),
      ].filter(Boolean));

      // Resumo vivo: a ficha montada com as escolhas de agora.
      const c = montarHeroi(id, e);
      const m = regrasDeMagia(h);
      resumo.replaceChildren(...[
        el('h3', {}, h.name),
        el('p', { class: 'menu-heroi-linha' }, `${h.className}, ${h.raca.toLowerCase()}`),
        el('dl', { class: 'menu-resumo-numeros' },
          el('dt', {}, 'PV'), el('dd', {}, maxHpEfetivo(c)),
          el('dt', {}, 'CA'), el('dd', {}, c.ac),
          el('dt', {}, 'Arma'), el('dd', {}, nomeDeId(c.weapons[0])),
          m && el('dt', {}, 'Magias'), m && el('dd', {}, `${e.truques.length} truques, ${e.magias.length} de 1º`)),
        ...problemasDaEscolha(id, e).map((p) => el('p', { class: 'menu-aviso' }, p)),
        botao('Automático para este herói', () => { escolhas[id] = escolhaAutomatica(id); redesenhar(); }),
      ].filter(Boolean));

      const faltam = ids.filter((i) => problemasDaEscolha(i, escolhas[i]).length);
      avisos.textContent = faltam.length
        ? `Falta escolher para ${faltam.map((i) => heroiPorId(i).name).join(', ')}`
        : 'Os quatro estão prontos';
      comecar.disabled = faltam.length > 0;
    }

    function secao(titulo, sub, ...filhos) {
      return el('section', { class: 'menu-secao' },
        el('h4', {}, titulo, sub && el('small', {}, sub)), ...filhos);
    }

    function secaoSubclasse(h, e) {
      const sub = SUBCLASSES_1[h.classe];
      if (!sub) return null;
      return secao(sub.rotulo, 'escolha uma',
        el('div', { class: 'menu-opcoes-cartao' }, ...sub.opcoes.map((o) => el('button', {
          class: `menu-opcao-cartao${e.subclasse === o.id ? ' marcada' : ''}`,
          onclick: () => { audio.play('click'); e.subclasse = o.id; redesenhar(); },
        }, el('strong', {}, o.nome, !o.motor && semRegra()), el('span', {}, o.resumo)))));
    }

    function secaoTalento(e, h) {
      return secao('Talento de origem', 'escolha um',
        el('div', { class: 'menu-opcoes-cartao' }, ...TALENTOS_DE_ORIGEM.map((t) => el('button', {
          class: `menu-opcao-cartao${e.talento === t.id ? ' marcada' : ''}`,
          // o humano variante já toma este talento (a versão do Livro do Jogador): não se pega duas vezes
          disabled: origemEmConflito(h, t.id) ? true : null, title: origemEmConflito(h, t.id) ? 'o talento do humano variante já é este' : null,
          onclick: () => { audio.play('click'); e.talento = t.id; redesenhar(); },
        }, el('strong', {}, t.nome, !t.temRegra && semRegra(), t.fora && foraDoCombate()), el('span', {}, t.resumo)))));
    }

    /** Iniciado em Magia: de que lista, quais dois truques e qual magia. */
    function secaoIniciado(h, e) {
      if (e.talento !== 'iniciadoEmMagia') return null;
      e.iniciado ??= escolhaDoIniciado(h);
      const ini = e.iniciado;
      const lista = LISTAS_DO_INICIADO[ini.lista];
      return secao('Iniciado em Magia', `lista do ${lista.nome.toLowerCase()}`,
        el('div', { class: 'menu-linha-equip' }, ...Object.entries(LISTAS_DO_INICIADO).map(([id, l]) => el('button', {
          class: `menu-chip${ini.lista === id ? ' marcada' : ''}`,
          onclick: () => { audio.play('click'); e.iniciado = escolhaDoIniciado(h, id); redesenhar(); },
        }, l.nome))),
        el('p', { class: 'menu-dica' }, `Truques: ${ini.truques.length} de 2`),
        chips(lista.truques, ini.truques, 2, (v) => { ini.truques = v; }),
        el('p', { class: 'menu-dica' }, `Magia de 1º círculo: ${ini.magia ? 1 : 0} de 1`),
        chips(lista.magias, ini.magia ? [ini.magia] : [], 1, (v) => { ini.magia = v[0] ?? null; }));
    }

    /** Fichas de magia que se marcam e desmarcam, com teto. */
    function chips(lista, marcadas, teto, aoMudar) {
      return el('div', { class: 'menu-chips' }, ...lista.map((id) => {
        const on = marcadas.includes(id);
        return el('button', {
          class: `menu-chip${on ? ' marcada' : ''}${magiaTemRegra(id) ? '' : ' sem-regra'}`,
          title: magiaTemRegra(id) ? null : 'Sem regra ainda: fica na ficha, mas ainda não dá para conjurar em combate.',
          onclick: () => {
            if (on) aoMudar(marcadas.filter((x) => x !== id));
            else if (marcadas.length < teto) aoMudar([...marcadas, id]);
            else return;
            audio.play('click');
            redesenhar();
          },
        }, nomeDaMagia(id));
      }));
    }

    function secoesDeMagia(h, e) {
      const m = regrasDeMagia(h);
      if (!m) return [];
      const rotulo = {
        conhecidas: ['Magias conhecidas', `${e.magias.length} de ${m.escolhe}`],
        preparadas: ['Magias preparadas', `${e.magias.length} de ${m.escolhe}, da lista inteira da classe`],
        livro: ['Livro de magias', `${e.magias.length} de ${m.escolhe} no livro`],
      }[m.modo];
      const lista = [
        secao('Truques', `${e.truques.length} de ${m.truques}`,
          chips(m.listaTruques, e.truques, m.truques, (v) => { e.truques = v; })),
        secao(rotulo[0], rotulo[1], chips(m.listaMagias, e.magias, m.escolhe, (v) => {
          e.magias = v;
          if (e.preparadas) e.preparadas = e.preparadas.filter((x) => v.includes(x));
        })),
      ];
      if (m.modo === 'livro') {
        lista.push(secao('Preparadas hoje', `${e.preparadas.length} de ${m.preparar}, das que estão no livro`,
          chips(e.magias, e.preparadas, m.preparar, (v) => { e.preparadas = v; })));
      }
      lista.push(el('p', { class: 'menu-dica' }, 'As marcadas em cinza ainda não têm regra no jogo: ficam na ficha, mas não aparecem na barra de ações.'));
      return lista;
    }

    function secaoEquipamento(h, e) {
      const eq = EQUIPAMENTO_1[h.classe];
      if (!eq) return null;
      const fixo = eq.fixo ?? {};
      const vemJunto = [
        fixo.armadura && nomeDeId(fixo.armadura),
        fixo.escudo && 'Escudo',
        ...(fixo.armas ?? []).map(nomeDeId),
        ...(fixo.itens ?? []).map(([i, q]) => (q > 1 ? `${q} × ${nomeDeId(i)}` : nomeDeId(i))),
        fixo.pacote && nomeDoPacote(fixo.pacote),
      ].filter(Boolean);
      return secao('Equipamento inicial', 'uma opção de cada linha',
        ...eq.grupos.map((g, gi) => el('div', { class: 'menu-linha-equip' }, ...g.map((o, oi) => el('button', {
          class: `menu-chip${(e.equipamento[gi] ?? 0) === oi ? ' marcada' : ''}`,
          onclick: () => { audio.play('click'); e.equipamento[gi] = oi; redesenhar(); },
        }, o.rotulo)))),
        vemJunto.length > 0 && el('p', { class: 'menu-dica' }, `Vem junto: ${vemJunto.join(', ')}.`));
    }

    redesenhar();
    return el('div', {},
      cabecalho('Preparar os heróis', 'O que o Livro do Jogador deixa escolher no 1º nível. Os atributos e a história já vêm prontos.'),
      abas,
      el('div', { class: 'menu-preparo-corpo' }, corpo, resumo),
      el('div', { class: 'menu-rodape' }, voltarBtn(), avisos, todosAuto, comecar));
  }

  return { telaGrupo, telaPreparo, telaCriar };
}

/**
 * O que o jogo recebe para montar a partida da campanha. O herói criado leva a DEFINIÇÃO junto: é ela que o põe no
 * jogo quando o save abre noutro navegador, onde o rol de heróis criados não existe.
 */
function configDaCampanha(aventura, ids, escolhas) {
  return {
    modo: 'campanha', aventura: aventura.id, variante: 'emboscada', nivel: 1,
    herois: ids.map((id) => {
      const h = heroiPorId(id);
      return { id, escolha: structuredClone(escolhas[id]), ...(h?.criado ? { definicao: structuredClone(h) } : {}) };
    }),
  };
}
