// O campo de batalha de um mapa (`mapaDo`): o terreno e tudo que o tabuleiro lê dele (salas, pisos, decoração,
// luz). Antes morava dentro de `App.newEncounter`; agora o navegador de quem NÃO roda a partida (F4) monta o
// mesmo campo a partir do mesmo mapa, e os dois nunca divergem.

import { Battlefield, ARESTA } from '../core/grid.js';
import { prepararRegioes } from '../rules/regioes.js';
import { definirEscuridao } from '../rules/luz.js';
import { arestasDosTracos } from './mapa-editor.js';

/** Monta o `Battlefield` de um mapa de `mapaDo()`. */
export function montarCampo(mapa) {
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length,
    mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
  // As ajudas de visão (silhueta de quem a parede cobre, marca de contato
  // perdido, anel de barulho) só valem nos mapas que as pedem: ligadas em
  // todos, o encontro padrão e o Poço ganharam contorno em quem não estava
  // coberto por nada.
  field.avisosDeVista = Boolean(mapa.avisosDeVista);
  // O ESPINHEIRO QUE COBRE: no esconderijo, o livro dá três quartos de cobertura (+5) a quem ataca através do mato
  // em volta do posto dos vigias (H1/H2). Só no mapa que pede: a emboscada e a rua também usam o glifo `%`, e lá o
  // livro não diz isso. A tocaia (`P`) conta junto: no livro as tábuas são o CHÃO do posto, e o que fica entre os
  // vigias e o riacho é o mato — o nosso gerador as desenhou como a borda da clareira, e é por ela que se atira.
  if (mapa.espinheiroCobre) {
    mapa.terreno.forEach((linha, y) => { for (let x = 0; x < linha.length; x++) if (linha[x] === '%' || linha[x] === 'P') field.matas.add(`${x},${y}`); });
  }
  // A SALA EMBAÇADA (a Encruzilhada da Forca, G12: a Nublar dos gnomos impregnou a pedra): todo ataque contra quem está
  // numa destas casas tem desvantagem, salvo de quem não depende da vista (percepção às cegas) ou vê através da ilusão
  // (visão verdadeira). `combat.js` pergunta.
  if (mapa.embacado?.length) field.embacado = new Set(mapa.embacado.map((c) => `${c.x},${c.y}`));
  // O mapa PINTADO por baixo e como ele se encaixa na grade (ver `mapa-editor.js`): quem desenha é a vista de cima.
  if (mapa.fundo) field.fundo = mapa.fundo;
  // AS SOBREPOSIÇÕES: pedaços de arte com nome que o roteiro acende e apaga (a fogueira, a ponte que cede, o
  // baú aberto). Vão COPIADAS, porque `ligada` muda durante a partida e o mapa da cena é compartilhado — sem a
  // cópia, acender a fogueira numa partida a deixava acesa na próxima.
  if (mapa.sobreposicoes?.length) {
    field.sobreposicoes = mapa.sobreposicoes.map((o) => ({ ...o, ligada: Boolean(o.ligada) }));
    /** Acende (`true`), apaga (`false`) ou inverte (sem argumento) uma peça pelo `id`. Devolve se mudou. */
    field.alternarSobreposicao = (id, ligada) => {
      const o = field.sobreposicoes.find((p) => p.id === id);
      if (!o) return false;
      const novo = ligada ?? !o.ligada;
      if (o.ligada === novo) return false;
      o.ligada = novo;
      return true;
    };
  }
  // AS REGIÕES (`rules/regioes.js`): a área que faz algo quando alguém entra, sai, ou começa e termina o turno nela.
  // Copiadas pelo mesmo motivo das sobreposições: `vezes`, `desligada` e `descoberta` mudam durante a partida.
  if (mapa.regioes?.length) prepararRegioes(field, mapa.regioes);
  // AS PORTAS TRANCADAS (`game/portas.js`): aresta 'x,y,N|O' → { cd, chave? }. Copiadas: destrancar numa partida
  // não destranca na próxima.
  if (mapa.trancas?.length) field.trancas = new Map(mapa.trancas.map((t) => [t.aresta, { ...t }]));
  // A CAMADA DE FRENTE: a parte da pintura que o tabuleiro redesenha POR CIMA das fichas, para copa e beiral
  // cobrirem quem passa debaixo (ver `mapa-editor.js`). É só aparência — quem barra passo é o terreno.
  if (mapa.frente) field.frente = mapa.frente;
  // A PAREDE LIVRE, como foi traçada: polilinhas em casas (com fração). A aresta de casa (`paredes`) é a derivada
  // delas para a regra; o desenho usa o traço, porque caverna, pedra e destroço não são retos.
  if (mapa.tracos?.length) field.tracos = mapa.tracos;
  // o tipo de cada traço (janela, porta, etérea...): a geometria da visão pergunta (`grid.cortadoPorTraco`)
  if (mapa.tracos?.length && mapa.tracosTipo) {
    field.tracosTipo = mapa.tracosTipo;
    // A PORTA TRAÇADA: as arestas que cada traço de porta derivou, para o desenho saber se ela está aberta (alguma
    // delas virou porta aberta no campo). Quem abre e fecha é o menu de porta, aresta a aresta, como qualquer porta.
    const portas = new Map();
    mapa.tracosTipo.forEach((car, i) => {
      if (car !== '+') return;
      const casas = [...arestasDosTracos(mapa, [mapa.tracos[i]], ['+']).keys()].map((k) => {
        const [lado, x, y] = k.split(',');
        return lado === 'n' ? [Number(x), Number(y) - 1, Number(x), Number(y)] : [Number(x) - 1, Number(y), Number(x), Number(y)];
      });
      portas.set(i, casas);
    });
    field.portaDoTracoAberta = (i) => (portas.get(i) ?? []).some(([ax, ay, bx, by]) => field.aresta(ax, ay, bx, by) === ARESTA.aberta);
  }
  // As salas do mapa, por casa: o tabuleiro usa para apagar a parede da
  // sala em que o grupo está (ver `board.desenharParedes`).
  // A decoração pendurada nas paredes, por aresta ('x,y,N' ou 'x,y,O').
  if (mapa.decor) {
    field.decor = new Map(mapa.decor.map((d) => [`${d.x},${d.y},${d.lado}`, d.tipo]));
  }
  // O piso de dentro de cada construcao (Arvore Trovao): laje rachada ou tabua.
  if (mapa.pisos) field.pisoDeSala = new Map(Object.entries(mapa.pisos));
  // As construções só se abrem à vista quando o grupo está dentro ou enxerga dentro (`board.calcularSalasReveladas`).
  field.fachadaFechada = Boolean(mapa.fachadaFechada);
  field.fachadaUnica = Boolean(mapa.fachadaUnica);   // todas as salas são UM prédio: fechado de fora, aberto por inteiro de dentro
  // A rocha junto de chão é desenhada como PAREDE de caverna (mais alta que um degrau): ver `board.alturaVisual`.
  field.paredeDeCaverna = Boolean(mapa.paredeDeCaverna);
  field.cliqueNoObjeto = Boolean(mapa.cliqueNoObjeto);   // o botão direito no corpo do sprite acha o objeto (a mansão)
  field.rochaEmCorte = Boolean(mapa.rochaEmCorte);   // a pedra na frente de uma sala fica baixa (a mansão)
  // O material das paredes de borda no atlas das faces (a Casa da Morte: papel de parede bordô, reboco velho).
  if (mapa.materialDaParede) field.materialDaParede = mapa.materialDaParede;
  field.vaoUnido = mapa.vaoUnido ? new Set(mapa.vaoUnido) : null;   // as arestas de porta que formam UM vão (a porta dupla): 'x,y,N|O'
  field.vaoPorCasa = Boolean(mapa.vaoPorCasa);       // cada porta é uma aresta, mesmo ao lado de outra (a Casa da Morte)
  field.paredeAlta = Number(mapa.paredeAlta) || 0;   // níveis de parede ACIMA do chão, só no desenho (a regra segue a altura do mapa)
  // As portas que têm FOLHA de madeira (o tabuleiro desenha a folha encostada quando aberta). As cenas do anfitrião refazem
  // isto; o espelho do convidado só tem o mapa, e sem esta lista nunca desenhava a folha.
  if (mapa.folhas) {
    const k = (a, b) => `${a.x},${a.y},${b.x},${b.y}`;
    field.folha = new Set(mapa.folhas.flatMap(([a, b]) => [k(a, b), k(b, a)]));
  }
  // Decoração na face de uma casa de PAREDE (a mansão, onde a parede é casa inteira e não aresta): 'x,y' → tipo.
  if (mapa.decorCasa) field.decorCasa = new Map(mapa.decorCasa.map((d) => [`${d.x},${d.y}`, d.tipo]));
  // As arestas de barra que são GRADE de ferro (a cela), e não seteira: o tabuleiro desenha barras em vez de parede.
  if (mapa.grades) field.grades = new Set(mapa.grades);
  if (mapa.degraus) field.degraus = new Map(mapa.degraus.map((d) => [`${d.x},${d.y}`, d.eixo]));
  // Os OBJETOS INTERAGÍVEIS do mapa (baú, alavanca, poço): a casa em que o grupo pode mexer. O menu do botão
  // direito os encontra por aqui (`game/interacoes.js`), e a cena pode reconhecê-los pelo `id`.
  if (mapa.interativos?.length) field.interativos = new Map(mapa.interativos.map((o) => [`${o.x},${o.y}`, o]));
  // O quanto o que o grupo não enxerga escurece (0 a 1; padrão 0,8). Árvore Trovão pede 1: preto.
  if (mapa.veuDaEscuridao != null) field.veuDaEscuridao = mapa.veuDaEscuridao;
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
  }
  // As fontes de luz do mapa, em TODO mapa — também ao ar livre, onde a janela e o lampião (`soNoEscuro`) esperam a
  // noite. Antes só iam junto com a grade de escuridão.
  if (mapa.luzes?.length) field.luzes = mapa.luzes.map((f) => ({ ...f, pos: { ...f.pos } }));
  // A escuridão da cena (0 dia, 1 noite: `rules/luz.js definirEscuridao`), quando o mapa a declara.
  if (mapa.escuridao != null) definirEscuridao(field, mapa.escuridao);
  // a NÉVOA EXPLORADA (`rules/nevoa.js`) vem ligada; o mapa que não quer diz `nevoaExplorada: false`
  if (mapa.nevoaExplorada === false) field.nevoaExplorada = false;
  return field;
}
