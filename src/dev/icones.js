// Verificador das grades de ícone.
//
// POR QUE EXISTE
// Um ícone é texto, e numa grade de texto uma linha com 31 caracteres em vez
// de 32 não dá erro nenhum: ela desenha, e desloca tudo o que vem depois.
// O defeito aparece como "o ícone ficou torto", que é a pior pista possível.
//
// Aqui cada grade é medida: todas as linhas do mesmo comprimento, o
// comprimento igual à contagem de linhas (grade quadrada), e todo caractere
// presente na paleta. Roda com:  node src/dev/icones.js

import { ICONES_ITENS, PALETA_ITENS } from '../art/icones-itens.js';

// A paleta base de `icons.js` não é exportada, e importar o módulo inteiro
// puxaria `document`. Os dígitos e letras aceitos estão listados aqui, e a
// lista é curta o bastante para não valer um export novo só por ela.
const BASE = '123456789abcde';
const VALIDOS = new Set([...BASE, ...Object.keys(PALETA_ITENS), '.', ' ']);

let falhas = 0;
const erro = (msg) => { console.log(` FALHA ${msg}`); falhas++; };

for (const [nome, grade] of Object.entries(ICONES_ITENS)) {
  const alt = grade.length;
  const larguras = new Set(grade.map((l) => l.length));

  if (larguras.size > 1) {
    const ruins = grade
      .map((l, i) => [i, l.length])
      .filter(([, w]) => w !== alt);
    erro(`${nome}: linhas de larguras diferentes — ${[...larguras].join(', ')}`);
    for (const [i, w] of ruins.slice(0, 6)) console.log(`        linha ${i}: ${w} caracteres`);
    continue;
  }

  const larg = [...larguras][0];
  if (larg !== alt) {
    erro(`${nome}: grade ${larg}x${alt} não é quadrada`);
    continue;
  }

  const fora = new Set();
  for (const linha of grade) for (const ch of linha) if (!VALIDOS.has(ch)) fora.add(ch);
  if (fora.size) erro(`${nome}: caracteres fora da paleta — ${[...fora].map((c) => `'${c}'`).join(', ')}`);

  // Um ícone que não acende nada é um buraco na interface, e o desenho em
  // texto esconde isso melhor que qualquer outra forma.
  const acesos = grade.join('').split('').filter((c) => c !== '.' && c !== ' ').length;
  if (acesos < 40) erro(`${nome}: só ${acesos} pixels acesos — provavelmente vazio`);
}

const n = Object.keys(ICONES_ITENS).length;
console.log(`\n${n} ícones de item medidos.`);
console.log(falhas === 0 ? 'tudo dentro do contrato.\n' : `${falhas} falha(s).\n`);
process.exit(falhas ? 1 : 0);
