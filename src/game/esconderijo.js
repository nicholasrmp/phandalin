// O ESCONDERIJO DOS GOBLINS (capítulo 2): o lado de fora e a caverna.
//
// Gerado por `src/dev/mapa-esconderijo.py` — mude lá e rode de novo; à mão
// aqui as três grades saem do lugar uma da outra.
//
// A ORGANIZAÇÃO segue a do esconderijo da aventura (a imagem de referência
// fica em `_referencias/`, fora do repositório): o riacho que sai da boca da
// caverna, o matagal dos vigias, o túnel do riacho, o canil, os degraus para o
// covil, o anel do norte até a ponte, os poços e a caverna do chefe. O
// DESENHO da grade é nosso, casa por casa — não é um decalque do mapa.
//
//   fora        o grupo chega pela trilha a sudoeste. Campo, mata nas bordas,
//               espinheiro; o riacho desce da boca para sudoeste. A leste
//               dele, o matagal onde dois goblins vigiam a entrada
//   túnel       da boca para o norte, o riacho no meio (terreno difícil) e uma
//               margem seca de cada lado. Escuro a partir da boca
//   canil       a leste do túnel, um degrau acima: os lobos acorrentados. Uma
//               fenda de entulho no fundo sobe até a caverna do chefe
//   degraus     no alto do túnel, para oeste, sobem dois níveis até o covil
//   covil       a sala grande do oeste, nível 2, com o palco do chefe dos
//               goblins (nível 3) e os mantimentos roubados
//   anel        do covil, um corredor sobe ao norte e corre para leste até a
//               ponte, que cruza o canal do riacho no nível 2
//   poços       nordeste: dois poços represados por um dique de pedra solta;
//               o de baixo é a nascente do canal
//   chefe       sudeste, a caverna maior, com o tesouro do bando
//
// Glifos (ver `GLIFOS` em `core/grid.js`): R rocha · _ chão de caverna ·
// w riacho · W poço fundo · = ponte · x entulho · A estalagmite ·
// s mantimentos · % espinheiro · z cama · F fogueira · K baú · P tocaia ·
// , grama ·
// T mata · b moita · r pedra.
// Alturas: um dígito por casa; a rocha fica um nível acima do chão vizinho
// (dois na encosta de fora), em corte, para não esconder o corredor de trás.
// Luz: 2 claro (o dia lá fora), 1 penumbra (a boca), 0 breu.

export const MAPA_ESCONDERIJO = {
  terreno: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRR_______________RRRRRR___WWWWWWWRR',
    'RRRRRRR_______________RRRRR___WWWWWWWW_R',
    'RRRRRRR__RRRRRRRRRRR__RRRRR____WWWWWWW_R',
    'RR___A___RRRRRRRRRRR__RRRRR_____xxxxxx_R',
    'R_zA____z_xxx_Rwwwww==wwwwwWWWW__WWWWW_R',
    'R____F____Rxx__wRwww==wwwwwWWWW_WWWWWW_R',
    'Rz_____z__RRxxwww_RR_______R______WWWW_R',
    'R_________RRRRwww_RR________R__A_______R',
    'R_ss__A___RRRRwww_RRRRRRRRR__A_________R',
    'R__s____z_RRRRwww_RRR____RR________A__RR',
    'RR_______RRRRRwww_RR______R___R_______RR',
    'RRRRRRRRRRRRRRwww______A__RR__________RR',
    'RRRRRRRRRRRRRRwww_RR_____xRRRR_RRRRRRRRR',
    'RRRRRRRRRRRRRRwww_RR______RRRR__RRRRRRRR',
    'RRRRRRRRRRRRRRwww_RRR____RRR__R_______RR',
    'TT,,,,,TT,,,RRwww_RRRRRRRRR_x_______z__R',
    'TT,TT,,,,T,,,,www_RRRRRRRRRRR___F____z_R',
    'TTTT,,,,,,,,,,,ww,,,,,,,RRR___A________R',
    'TT,,,,,,r,,,,,ww,,,,,,,,RRR____________R',
    'TT,,,%%,,,,,,,ww,%%b%%b%%RR_______A____R',
    'TT,,,,%,,,,,,ww,,%b%PPP%bRR__________s_R',
    'TTT,r,,,,,,,,ww,,b%P,,,P%,RR_A______Ks_R',
    'TTT,,,,,,%%,ww,,,%%P,,,%b,RR_______sss_R',
    'TTT,,,,,,,,,ww,,,b%%,%%b%,RR__________RR',
    'TTT,,,,,,,,ww,,,,%b%%b%%%,RRRRRRRRRRRRRR',
    'TTTTTTTT,,,ww,,,TTTTTT,,,,RRRRRRRRRRRRRR',
    'TTTTTTTTTTwwTTTTTTTTTT,,,,RRRRRRRRRRRRRR',
  ],
  altura: [
    '3335555555555555555555555555555555555555',
    '3333555444444444444444555555444444444455',
    '3333355444444444444444555554444444444445',
    '3333335335555555555544555554444444444445',
    '3322222224333321111544545554444444444445',
    '3222222222222120000044123444444444444445',
    '3222222222322100100044123444444444444445',
    '5222222222531100001544444445444444444445',
    '5444334444522200001544444444544444444445',
    '5444444444522100001555555554444444444445',
    '5444444444551100001221111254444444444455',
    '5544444445551100002211111154445444444455',
    '5555555555551100000111111155444444444455',
    '5555555555511100002211111125554555555555',
    '2222222222221100001211111124453344444444',
    '2222222222222100001221111244334333333344',
    '0000000000002200001222222243333333333334',
    '0000000000000000002222222244433333333334',
    '0000000000000000000000002243333333333334',
    '0000000000000000000000002243333333333334',
    '0000000000000000000000000243333333333334',
    '0000000000000000000000000243333333333334',
    '0000000000000000000000000044333333333334',
    '0000000000000000000000000024333333333334',
    '0000000000000000000000000024333333333344',
    '0000000000000000000000000024444444444444',
    '0000000000000000000000000024444444444444',
    '0000000000000000000000000022444444444444',
  ],
  luz: [
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000',
    '0000000000000111111000000000000000000000',
    '0000000000000111111000000000000000000000',
    '0000000000000111111000000000000000000000',
    '2222222222222222222000000000000000000000',
    '2222222222222222222000000000000000000000',
    '2222222222222222222222220000000000000000',
    '2222222222222222222222220000000000000000',
    '2222222222222222222222222000000000000000',
    '2222222222222222222222222000000000000000',
    '2222222222222222222222222200000000000000',
    '2222222222222222222222222200000000000000',
    '2222222222222222222222222200000000000000',
    '2222222222222222222222222200000000000000',
    '2222222222222222222222222200000000000000',
    '2222222222222222222222222200000000000000',
  ],
};
