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
import { temArteImportada } from '../art/folhas/index.js';
import {
  HEROIS, montarHeroi, escolhaAutomatica, problemasDaEscolha, regrasDeMagia,
  SUBCLASSES_1, TALENTOS_DE_ORIGEM, EQUIPAMENTO_1, nomeDaMagia, magiaTemRegra, nomeDoPacote,
  LISTAS_DO_INICIADO, escolhaDoIniciado,
} from '../game/criacao.js';

const GRUPO = 4;   // a carroça leva quatro, e o mapa tem quatro lugares de partida

// Só entra na carroça quem já tem as animações do PixelLab: os outros aparecem
// apagados, "Não disponível", até a arte deles ficar pronta (pedido do dono).
const disponivel = (h) => temArteImportada(h.look);

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
    const pronto = botao('Jogar com os prontos', () => comecar(true));
    const preparar = botao('Preparar os heróis', () => comecar(false), { primario: true });

    function comecar(automatico) {
      const ids = HEROIS.map((h) => h.id).filter((id) => grupo.escolhidos.includes(id));
      const escolhas = Object.fromEntries(ids.map((id) => [id, escolhaAutomatica(id)]));
      if (automatico) iniciar(configDaCampanha(aventura, ids, escolhas));
      else ir('preparo', { aventura, ids, escolhas, aba: ids[0] });
    }

    let tentativas = 0;
    function redesenhar() {
      let faltou = false;
      lista.replaceChildren(...HEROIS.map((h) => {
        const marcado = grupo.escolhidos.includes(h.id);
        if (!disponivel(h)) {
          return el('button', { class: 'menu-heroi compacto indisponivel', disabled: true, title: 'A arte deste herói ainda está sendo feita.' },
            el('span', { class: 'menu-heroi-retrato' }, retrato(h.look, () => { faltou = true; })),
            el('span', { class: 'menu-heroi-nome' }, h.name),
            el('span', { class: 'menu-heroi-classe' }, `${h.className} · ${h.raca}`),
            el('span', { class: 'menu-heroi-marca' }, 'Não disponível'));
        }
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

      const h = HEROIS.find((x) => x.id === grupo.foco);
      const ficha = montarHeroi(h.id);
      const marcado = grupo.escolhidos.includes(h.id);
      detalhe.replaceChildren(...[
        el('header', {},
          el('h3', {}, h.name),
          el('p', { class: 'menu-heroi-linha' }, `${h.className}, ${h.raca.toLowerCase()}, nível 1 · ${h.antecedente}`),
          el('p', { class: 'menu-heroi-numeros' }, `PV ${maxHpEfetivo(ficha)} · CA ${ficha.ac} · Deslocamento ${h.speedFt} pés`)),
        el('p', { class: 'menu-heroi-origem' }, h.origem),
        ...h.historia.map((p) => el('p', {}, p)),
        el('p', { class: 'menu-heroi-motivo' }, el('strong', {}, 'Por que está na estrada. '), h.motivo),
        el('dl', { class: 'menu-heroi-tracos' },
          ...[['Traço', h.traco], ['Ideal', h.ideal], ['Vínculo', h.vinculo], ['Defeito', h.defeito]]
            .flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)])),
        el('p', { class: 'menu-dica' }, marcado
          ? 'Clique de novo no retrato para tirá-lo do grupo.'
          : grupo.escolhidos.length < GRUPO ? 'Clique de novo no retrato para pô-lo no grupo.' : 'O grupo já tem quatro: tire alguém para pôr este.'),
      ]);

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
      const h = HEROIS.find((x) => x.id === id);
      const e = escolhas[id];

      abas.replaceChildren(...ids.map((i) => {
        const hh = HEROIS.find((x) => x.id === i);
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
        secaoTalento(e),
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
        ? `Falta escolher para ${faltam.map((i) => HEROIS.find((x) => x.id === i).name).join(', ')}`
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

    function secaoTalento(e) {
      return secao('Talento de origem', 'escolha um',
        el('div', { class: 'menu-opcoes-cartao' }, ...TALENTOS_DE_ORIGEM.map((t) => el('button', {
          class: `menu-opcao-cartao${e.talento === t.id ? ' marcada' : ''}`,
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

  return { telaGrupo, telaPreparo };
}

/** O que o jogo recebe para montar a partida da campanha. */
function configDaCampanha(aventura, ids, escolhas) {
  return {
    modo: 'campanha', aventura: aventura.id, variante: 'emboscada', nivel: 1,
    herois: ids.map((id) => ({ id, escolha: structuredClone(escolhas[id]) })),
  };
}
