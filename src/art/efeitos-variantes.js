// Variantes de cor dos efeitos de magia, feitas trocando as letras da paleta
// nos quadros que já existem — sem gastar crédito no OpenArt. Cada linha diz
// de qual efeito sai e que letra vira qual (as letras de `P` em icons.js).

import { EFEITOS } from './efeitos.js';

function variante(nome, base, troca) {
  const b = EFEITOS[base];
  if (!b) return;
  EFEITOS[nome] = {
    lado: b.lado,
    quadros: b.quadros.map((g) => g.map((linha) => [...linha].map((ch) => troca[ch] ?? ch).join(''))),
  };
}

// Só alguns quadros, na ordem dada (pode repetir): o conversor só sabe pular.
function recorte(nome, base, indices) {
  const b = EFEITOS[base];
  if (!b) return;
  EFEITOS[nome] = { lado: b.lado, quadros: indices.map((i) => b.quadros[i]).filter(Boolean) };
}

// Ácido é amarelo-limão, não o verde do veneno.
variante('acido-projetil', 'veneno-projetil', { c: '6', 3: '7' });
variante('acido-impacto', 'veneno-impacto', { c: '6', 3: '7' });
// Luar é prata e azul, não o dourado da Chama Sagrada.
variante('luz-coluna-prata', 'luz-coluna', { 6: '1', 7: '9' });
// Lentidão: névoa cinza; Cegueira: névoa escura.
variante('nevoa-cinza', 'sono-nevoa', { d: '2', b: '1' });
variante('nevoa-escura', 'sono-nevoa', { d: 'e', 1: '3', b: '3' });
// Imobilizar Pessoa: a corrente em aço, sem o anel vermelho.
variante('corrente-aco', 'maldicao', { d: '2', 8: '3' });
// Perdição: a corrente não pula para o vermelho no meio.
variante('maldicao', 'maldicao', { 8: 'd' });
// Padrão Hipnótico: as mesmas duas cores em todos os quadros (não pisca).
variante('hipnose', 'hipnose', { 8: 'd', 9: '6' });
// Proteção contra Energia (pela cor do tipo) e contra Veneno.
variante('resistencia-fogo', 'resistencia', { 9: '8', 2: '7' });
variante('resistencia-acido', 'resistencia', { 9: '6', 2: '7' });
variante('resistencia-trovao', 'resistencia', { 9: '1' });
variante('resistencia-verde', 'resistencia', { 9: 'c' });
// As vinhas secas (sem o verde).
variante('vinhas-secas', 'vinhas', { c: '4' });
// O golpe divino na cor de cada golpe preparado; o estouro branco também muda.
variante('golpe-fogo', 'golpe-divino', { 7: '8', b: '6' });
variante('golpe-psiquico', 'golpe-divino', { 7: 'd', 6: 'b', b: 'd' });
variante('golpe-trovao', 'golpe-divino', { 7: '9', 6: '1', b: '9' });
// A espada do golpe base em ouro claro, não bronze (depois das variantes, que saem do original).
variante('golpe-divino', 'golpe-divino', { 7: '6', 6: 'b' });
// A égide sem a base reta (o anel de seleção faz o chão) e o escudo dela
// separado, para lampejar ACIMA da cabeça em vez de no rosto.
const tem = (l) => /[^.]/.test(l);
function semBase(nome, n = 5) {
  const e = EFEITOS[nome];
  if (!e) return;
  e.quadros = e.quadros.map((g) => {
    let fim = g.length - 1;
    while (fim > 0 && !tem(g[fim])) fim--;
    const ref = g[fim - n];
    return g.map((l, y) => (y > fim - n && y <= fim ? [...l].map((k, x) => (ref[x] === '.' ? '.' : k)).join('') : l));
  });
}
function escudoDaEgide() {
  const e = EFEITOS.egide;
  if (!e) return;
  const g = e.quadros[2];
  const topo = e.quadros[3].findIndex(tem);
  const y0 = g.findIndex(tem);
  let x0 = Infinity;
  let x1 = -1;
  for (let y = y0; y < topo; y++) [...g[y]].forEach((k, x) => { if (k !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } });
  const y1 = Math.min(g.length - 1, topo + (topo - y0) - 1);
  EFEITOS['egide-escudo'] = { lado: y1 - y0 + 1, quadros: [g.slice(y0, y1 + 1).map((l) => l.slice(x0, x1 + 1))] };
}
semBase('egide');
escudoDaEgide();
// Égide: Santuário é só o domo, sem o escudo (não é CA); Proteção contra o
// Bem e o Mal, o mesmo domo em violeta.
recorte('egide-domo', 'egide', [0, 1, 3]);
variante('egide-violeta', 'egide-domo', { 6: 'd', 7: 'd' });
// Medo: o crânio de fumaça em violeta, não cinza.
variante('medo-espectro', 'medo-espectro', { 3: 'd' });

// Glifo de Proteção: a erupção dourada na cor de cada tipo de dano da runa.
variante('glifo-acido', 'glifo-erupcao', { 6: 'c', 7: '5' });
variante('glifo-frio', 'glifo-erupcao', { 6: '9', 7: '3', b: '1' });
variante('glifo-fogo', 'glifo-erupcao', { 6: '8', 7: '5', b: '6' });
variante('glifo-eletrico', 'glifo-erupcao', { 6: 'b', 7: '9', 1: '9' });
variante('glifo-trovejante', 'glifo-erupcao', { 6: 'd', 7: '3', b: '1' });
