// O campo de batalha de um mapa (`mapaDo`): o terreno e tudo que o tabuleiro lê dele (salas, pisos, decoração,
// luz). Antes morava dentro de `App.newEncounter`; agora o navegador de quem NÃO roda a partida (F4) monta o
// mesmo campo a partir do mesmo mapa, e os dois nunca divergem.

import { Battlefield } from '../core/grid.js';

/** Monta o `Battlefield` de um mapa de `mapaDo()`. */
export function montarCampo(mapa) {
  const field = new Battlefield(mapa.terreno[0].length, mapa.terreno.length,
    mapa.terreno, mapa.altura, mapa.objetos, mapa.paredes);
  // As ajudas de visão (silhueta de quem a parede cobre, marca de contato
  // perdido, anel de barulho) só valem nos mapas que as pedem: ligadas em
  // todos, o encontro padrão e o Poço ganharam contorno em quem não estava
  // coberto por nada.
  field.avisosDeVista = Boolean(mapa.avisosDeVista);
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
  // A rocha junto de chão é desenhada como PAREDE de caverna (mais alta que um degrau): ver `board.alturaVisual`.
  field.paredeDeCaverna = Boolean(mapa.paredeDeCaverna);
  field.rochaEmCorte = Boolean(mapa.rochaEmCorte);   // a pedra na frente de uma sala fica baixa (a mansão)
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
    field.luzes = (mapa.luzes ?? []).map((f) => ({ ...f }));
  }
  return field;
}
