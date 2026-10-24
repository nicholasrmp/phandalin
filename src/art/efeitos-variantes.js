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
// Crescimento de Espinhos: as vinhas, secas (sem o verde), só os brotos baixos.
variante('vinhas-secas', 'vinhas', { c: '4' });
recorte('espinhos-chao', 'vinhas-secas', [0, 1, 0]);
// Chicote de Espinhos: um estalo de brotos, não o matagal do Emaranhar.
recorte('vinhas-brotos', 'vinhas', [0, 1]);
// O golpe divino na cor de cada golpe preparado; o estouro branco também muda.
variante('golpe-fogo', 'golpe-divino', { 7: '8', b: '6' });
variante('golpe-psiquico', 'golpe-divino', { 7: 'd', 6: 'b', b: 'd' });
variante('golpe-trovao', 'golpe-divino', { 7: '9', 6: '1', b: '9' });
// A espada do golpe base em ouro claro, não bronze (depois das variantes, que saem do original).
variante('golpe-divino', 'golpe-divino', { 7: '6', 6: 'b' });
// O choque psíquico segura o pico um quadro a mais (os quadros de antes se perderam).
recorte('psiquico', 'psiquico', [0, 0, 1, 2]);
// Égide: Santuário é só o domo (não é CA); Proteção contra o Bem e o Mal, em violeta.
recorte('egide-domo', 'egide', [0, 2]);
variante('egide-violeta', 'egide-domo', { 1: 'd' });
