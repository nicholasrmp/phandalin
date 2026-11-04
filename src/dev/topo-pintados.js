// GERADO por `python src/dev/alinhar-mapa-pintado.py --provas`. Não edite à mão: rode o script de novo.
//
// Onde cada mapa PINTADO (Morvold Press / Jeff Todd) cai na grade do jogo. `escala` é quantos pixels da imagem
// valem uma casa; `x0`/`y0` é onde cai o canto da casa (0,0) do terreno, já com o `giro` aplicado; `nota` é a
// qualidade do encaixe medida pela correlação (0,6 e acima é bom; abaixo de 0,4 foi conferido a olho).
//
// As imagens ficam em `_referencias/casa-da-morte-morvold/`, FORA do versionamento: é arte comercial de terceiros,
// serve de consulta e NÃO pode ser publicada com o jogo. O protótipo só as acha rodando o Vite em desenvolvimento.

export const PASTA_PINTADOS = '/_referencias/casa-da-morte-morvold/';

export const PINTADOS = {
  casaDaMorte1: { arquivo: 'morvold-press-jeff-todd-deathhouse1floor.jpg', giro: 0, escala: 198.82, x0: -136.0, y0: -164.0, nota: 0.6177 },
  casaDaMorte2: { arquivo: 'morvold-press-jeff-todd-deathhouse2floor.jpg', giro: 0, escala: 198.05, x0: -116.0, y0: -164.0, nota: 0.6443 },
  casaDaMorte3: { arquivo: 'morvold-press-jeff-todd-deathhouse3floor.jpg', giro: 0, escala: 197.05, x0: -132.0, y0: -156.0, nota: 0.4114 },
  casaDaMorte4: { arquivo: 'morvold-press-jeff-todd-deathhouse4floor.jpg', giro: 0, escala: 197.31, x0: -164.0, y0: -152.0, nota: 0.3459 },
  // este foi o unico que a correlacao nao resolveu sozinha: afinado medindo, no navegador, quanta casa de chao cai sobre chao pintado
  casaDaMortePorao1: { arquivo: 'morvold-press-jeff-todd-deathhousebasement1floor.jpg', giro: 90, escala: 78.5, x0: 5.0, y0: -18.2, nota: 0.475 },
  casaDaMortePorao2: { arquivo: 'morvold-press-jeff-todd-deathhousebasement2floor.jpg', giro: 90, escala: 127.73, x0: 43.7, y0: 15.7, nota: 0.8172 },
};
