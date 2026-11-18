// Definição do encontro, separada do código que o monta.
//
// Fica aqui porque DUAS coisas precisam dela: o jogo e o simulador de
// balanceamento (`dev/balance.js`). Se o mapa e a lista de inimigos morassem
// dentro de main.js, cada ajuste de equilíbrio exigiria mexer em dois lugares —
// e os dois sairiam do lugar.
//
// É também o primeiro passo na direção de campanha como dados.

import { makeMonster } from '../rules/monsters.js';
import { makeNpc } from '../rules/npcs.js';
import { MAPA_ESCONDERIJO, PONTOS_DO_ESCONDERIJO } from './esconderijo.js';
import { MAPA_CAVERNA_DO_POCO, MAPA_ACAMPAMENTO_SAWPLEE, MAPA_TELHADO_GIGANTE, MAPA_GIGANTE_TERREO, PONTOS_CAP5_VILA } from './obelisco5-mapas.js';
import { MAPA_ZORZULA_POSTO, MAPA_ZORZULA_MINAS, MAPA_ZORZULA_SANTUARIO, PONTOS_ZORZULA } from './zorzula-mapas.js';
import { MAPA_CASA_MARTHUNGRIM, MAPA_MINA_HARDYHAMMER, MAPA_LARGO_DA_VACA, PONTOS_CAP6_VILA } from './obelisco6-mapas.js';
import { MAPA_SANTUARIO_INFECTADO, PONTOS_CAP7_VILA } from './obelisco7-mapas.js';
import { MAPA_CAVERNAS_GRELLS, MAPA_TOCA_BEHIR, MAPA_GRUTA_TAGARELA, PONTOS_TUNEL7 } from './tunel-cap7-mapas.js';
import { MAPA_ILLITHINOCH, PONTOS_ILLITHINOCH } from './illithinoch-mapa.js';
import { MAPA_TRINCHEIRAS, MAPA_OCO_DA_DESOVA, MAPA_LABIRINTO_DOS_OLHOS, PONTOS_FENDAS } from './fendas-mapas.js';
import { MAPA_LABIRINTO_SALGADO, MAPA_COVIL_LOWARNIZEL, PONTOS_LABIRINTO, PONTOS_COVIL } from './labirinto-salgado-mapa.js';
import { MAPA_POCA, PONTOS_POCA } from './poca-salgada.js';
import * as VAZIO from './vazio-mapas.js';
import { MAPA_TALHUNDERETH, PONTOS_TALHUNDERETH } from './talhundereth-mapa.js';
import { MAPA_ENCRUZILHADA, PONTOS_ENCRUZILHADA } from './encruzilhada-mapa.js';
import { MAPA_CRIPTA, PONTOS_CRIPTA } from './cripta-mapa.js';
import { MAPA_MANSAO, MANSAO } from './mansao.js';
import { MAPA_CASA_DA_MORTE_1, MAPA_CASA_DA_MORTE_2, MAPA_CASA_DA_MORTE_3, MAPA_CASA_DA_MORTE_4, MAPA_CASA_DA_MORTE_PORAO_1, MAPA_CASA_DA_MORTE_PORAO_2 } from './casadamorte.js';
import { foesDaCasa } from './casadamorte-criaturas.js';
import { ler as lerMapaDoEditor, novoMapa as mapaVazioDoEditor } from './mapa-editor.js';
import { MAPA_POCO } from './poco.js';
import { MAPA_CUME, CUME } from './cume.js';
import { MAPA_CASTELO, CASTELO } from './castelo.js';
import { MAPA_ARVORE_TROVAO, ARVORE_TROVAO } from './arvoretrovao.js';
import { MAPA_ONDA_ECO, ONDA_ECO } from './ondaeco.js';

// '.' chão · '#' parede · '~' terreno difícil · 'o' cobertura · '1'..'9' elevação
//
// A ARENA DO SIMULADOR. NÃO é uma cena do jogo: não está no menu, não está na lista do editor e a conferência
// de parede e porta não passa por ela. É a bancada onde `src/dev/balance.js` mede equilíbrio desde o começo do
// projeto — todos os números de encontro citados nos comentários daqui saíram dela — e onde a vitrine de
// tamanhos (`grandes`) põe as criaturas Grandes e Enormes para serem vistas.
//
// Ela saiu do jogo porque é um mapa DESENHADO EM CÓDIGO, e os mapas do jogo agora são pintados. Ficou como
// gabarito de medição, que é o que sempre foi de fato: trocá-la invalidaria a série de medidas inteira.
//
// O paredão central (x7–9, y4–6) existe porque, sem ele, os dois lados se veem do primeiro quadrado e o combate
// vira troca de tiros de 24 m. O platô do canto nordeste (altura 1) é onde os goblins se posicionam: subir custa
// o dobro, quem está em cima tem cobertura e o platô corta a visão de quem tenta contornar.
export const MAPA_ARENA = [
  '################',
  '#......o...111.#',
  '#..~~..o...111.#',
  '#..~~......111.#',
  '#......###.....#',
  '#......###.....#',
  '#......###.....#',
  '#..oo..........#',
  '#..oo..1...~~..#',
  '#......1...~~..#',
  '#..............#',
  '################',
];

/** Guerreira na frente, mago atrás — o posicionamento inicial já ensina. */
export const PARTIDA_ARENA = [
  { x: 3, y: 9 }, { x: 2, y: 10 }, { x: 2, y: 9 }, { x: 1, y: 10 },
];

// A EMBOSCADA NA ESTRADA.
//
// A Trilha Triboar cortando a mata: uma faixa de terra batida de leste a oeste, moita fechada nas duas beiras e
// floresta além dela. Uma carroça de mercador tombada tapa o caminho na ponta oeste; dois cavalos de tiro mortos,
// ainda na arreata, estão caídos na estrada a leste. Os goblins esperam na moita dos dois lados.
//
// O MAPA É UM DESENHO, e não um rascunho de caracteres: `public/mapas/emboscada.webp`, gerado por nós no OpenArt,
// 1760x1360 = 22 por 17 casas de 80 px. O terreno abaixo SAI DELE, por cor
// (`python src/dev/mapa-emboscada.py` remede e reimprime), então os dois não divergem: o que a regra chama de
// bloqueio é o que o jogador vê pintado.
//
// A CARROÇA BARRA A TRILHA de verdade: na coluna 4 ela vai de beira a beira, e quem quiser passar sai pela moita.
// Isso não foi escolhido, é o que o desenho mostra — e por isso o grupo começa a LESTE dela, entre o destroço e
// os cavalos.
export const MAPA_EMBOSCADA = {
  //   `:` estrada            `%` espinheiro (terreno difícil, a moita do livro, de onde os goblins saltam)
  //   `T` mata fechada       `C` carroça e destroço, `h` os cavalos de Gundren e de Sildar (vivos, no Obelisco;
  //                          ocupam a casa e não se atravessam)
  terreno: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTT%TT%TTTTTTTTTTTTTTT',
    '%%%%%%%%%%%%%%%%%%%%%%',
    '%%%C%%C%%%%%%%%%%%%%%%',
    ':::CCCC:::::::::::hh::',
    '::::C:::::::::::::hhh:',
    '::::CC::::::::::::hhh:',
    '%%CCCC::::::::::%%%%%%',
    '%%%CCC%%%%%%%%%%%%%%%%',
    'TT%%%%%%%%%%%%%%TTTTTT',
    'TTT%%%TTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  // A trilha é plana: o desenho não tem barranco, e inventar um desnível que a imagem não mostra seria mentir
  // para quem olha o mapa.
  altura: null,
  // A carroça e os cavalos JÁ ESTÃO PINTADOS no mapa; pôr o sprite por cima seria desenhá-los duas vezes.
  // Eles continuam valendo como regra: `C` e `h` são cobertura (+2 de CA) e não se atravessa.
  objetos: [],
};
// A RUA DE PHANDALIN (capítulo 3): a briga com os Marcarrubra, na frente do Gigante Adormecido.
//
// O MAPA É UM DESENHO: `public/mapas/rua.webp`, gerado por nós no OpenArt, 1760x1120 = 22 por 14 casas de
// 80 px. Antes era código: rua retangular de três fileiras de ponta a ponta e cinco prédios em blocos de 3 x 3
// exatos, num ritmo regular.
//
// O terreno sai do desenho, mas por DOIS caminhos, e vale saber qual é qual (`src/dev/mapa-rua.py` explica a
// medida): o chão sai da cor, como no Ermo; as PEGADAS DOS PRÉDIOS saem da mão, decalcadas da imagem, porque a
// palha do telhado e a terra da rua ficam na mesma faixa de matiz e de brilho — e o preenchimento conexo também
// não resolve, já que o telhado da estalagem encosta na rua e os dois viram um borrão só.
export const MAPA_RUA = [
  'TT:T:,,,::YYY,,,,TTTTT',
  'T::,:,,TYYYYYYu:,TTTTT',
  '::HHH,,,YYYYYY::u,HHHT',
  ':,HHH,,,YYYYYY::u:HHHT',
  ',,HHH,,:YYYYYY::,,HHH,',
  ',,,:,,,:,,,:,,uu,:,,,,',   // os dois `u` são os barris do Gigante Adormecido, (14,5) e (15,5): ver abaixo
  '::::::::::::::::::::::',
  '::::::::::::::::::::::',
  ',,,,,,,::,,:,:,,,T,,,T',
  ',TrHHH,:,,,:HHH,TT,,,T',
  ',,rHHH,,,:,,HHH,,,,,,T',
  'TTr,,,,%%%,T,,,,T,,,TT',
  'TTrrrrr%%%,T,,,,T,,:::',
  'TTTTTTTT,,,TT,,TTTT:TT',
];

// O ERMO: a Trilha de Triboar entre colinas, onde caem os encontros de viagem (`game/regiao.js` manda para cá
// de dia e para o `ermoNoite` depois do escurecer).
//
// O MAPA É UM DESENHO: `public/mapas/ermo.webp`, gerado por nós no OpenArt, 1760x1200 = 22 por 15 casas de
// 80 px. O terreno abaixo SAI DELE, por cor (`python src/dev/mapa-ermo.py` remede e reimprime). Antes era
// desenhado em código: uma estrada retangular de duas casas atravessando o campo em linha reta, quatro borrões
// de mata nos cantos e dezoito moitas salpicadas uma a uma, que taticamente era campo aberto com confete.
//
// Agora a trilha serpenteia e muda de largura, a moita fecha a curva do meio (e empurra quem passa para a volta
// pelo sul), os pedregulhos vêm em grupo e o bosque fica nas bordas. `:` estrada e `,` grama valem o mesmo para
// a regra — a diferença é o som do passo e a tinta por baixo do desenho —, então o glifo de estrada marca o
// miolo do caminho, e não a largura pintada inteira.
export const MAPA_ERMO = [
  'TTT,,,,,,,,,,,,,,,,TTT',
  'T,,,,,,,,,,,,,,,,,TTTT',
  'T,,,,,,,,,,,,,,,,,,,TT',
  ',,,,,,,,,,,,,,,,,,,,,T',
  ',,,rr,,,,,,,,,,,,,,,,,',
  ',,,,,::::,,,,,,,,,,,,,',
  ',,,::::::::b,,,,,,::,,',
  '::::,,,,b,::bb,:::::::',
  ',,,r,,,,bbb:::::,,,,,,',
  ',,,b,,,,,bbb,,,,,r,,,,',
  ',,,,,,,,,,,,,,,,,,,,,T',
  ',,,,,,,,,,,,,,,,,,,,,T',
  ',,,,,,,,,,,,,,,,,,TTTT',
  'TT,,,,,,,,,,,,,,,,TTTT',
  'TTTT,,,,,,,T,,,,,TTTTT',
];
// A fogueira do acampamento, em (11,5): grama aberta ao NORTE da trilha. No mapa antigo ela caía em cima
// do caminho, que é o último lugar onde alguém acampa.
export const MAPA_ERMO_NOITE = MAPA_ERMO.map((l, y) => (y === 5 ? `${l.slice(0, 11)}F${l.slice(12)}` : l));

/**
 * O grupo vem pela trilha olhando para leste, JÁ DEPOIS da carroça tombada: ela tapa a estrada inteira na coluna
 * 4, então começar a oeste dela seria começar preso. Os cavalos mortos ficam oito casas à frente — é o que o
 * grupo enxerga na estrada quando os goblins atiram da moita.
 */
export const PARTY_SPOTS_EMBOSCADA = [
  { x: 11, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 8 }, { x: 10, y: 10 },
];

/**
 * O mapa, as posições do grupo e para onde ele olha, por variante.
 *
 * Mapa e posições andam juntos: uma posição boa num mapa cai dentro de uma
 * árvore no outro.
 */
export function mapaDo(variante) {
  if (variante === 'emboscada') {
    return {
      terreno: MAPA_EMBOSCADA.terreno,
      altura: MAPA_EMBOSCADA.altura,
      objetos: MAPA_EMBOSCADA.objetos,
      grupo: PARTY_SPOTS_EMBOSCADA,
      olhar: { dx: 1, dy: 0 },
      // O mapa PINTADO por baixo. É NOSSO (gerado no OpenArt), entra no repositório e o Vite o serve de
      // `public/`. Já vem cortado na grade: 80 px por casa, e o canto da casa (0,0) é o canto da imagem.
      fundo: { nome: 'emboscada.webp', url: '/mapas/emboscada.webp', escala: 80, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      // A COPA POR CIMA DAS FICHAS: a folhagem do desenho é redesenhada depois dos personagens, para quem anda
      // na beira da mata ficar debaixo dela. Das 50 casas andáveis que encostam em copa aqui, a folha cobre
      // 47,6% da casa na mediana — por isso a máscara é por PIXEL, tirada da própria pintura, e não por casa.
      frente: { cor: { verde: 12, escuro: 92 } },
      // Os goblins estão escondidos: rola-se surpresa no começo (combat.js).
      emboscada: { emboscadores: 'foes' },
      // o que a chegada descreve em volta dos cavalos (`capitulo1.js`), para olhar de graça
      interativos: [
        { x: 16, y: 7, id: 'flechasPretas', rotulo: 'Olhar as flechas', texto: 'Flechas curtas de penas pretas, cravadas na terra e no barranco. Ponta de pedra lascada, haste torta: trabalho de goblin.' },
        { x: 16, y: 10, id: 'traposRasgados', rotulo: 'Olhar os trapos', texto: 'Trapos rasgados e pisoteados, e na terra fofa da beira da estrada o sulco de duas coisas pesadas arrastadas para o mato.' },
        { x: 17, y: 9, id: 'bagagemRevirada', rotulo: 'Olhar a bagagem', texto: 'O que saiu dos alforjes, espalhado pela estrada: roupa, uma panela amassada, um saco de feijão rasgado. No meio de tudo, um tubo de couro de guardar mapa, aberto e vazio.' },
      ],
    };
  }
  if (variante === 'rua') {
    return {
      terreno: MAPA_RUA,
      altura: null,
      // Os prédios JÁ ESTÃO PINTADOS no mapa; o sprite por cima seria desenhá-los duas vezes. Eles continuam
      // valendo como regra: `H` e `Y` barram passo e visão.
      //
      // OS BARRIS DO GIGANTE ADORMECIDO entraram como TERRENO (`u`, que barra o passo e dá meia cobertura),
      // em (14,5) e (15,5), e não como peça: o pátio de barris já está pintado logo acima, em x16, e estes
      // dois só o estendem até a esquina da rua. O texto da provocação sempre disse "um sentado num barril,
      // os outros encostados nas colunas" (`phandalin.js`), e a briga não tinha barril nenhum onde se
      // encostar — quatro bandidos e quatro heróis em campo liso. Agora o lado leste tem onde se abrigar, que
      // é de quem é a varanda. As fileiras 6 e 7, que são a rua, continuam livres de ponta a ponta.
      //
      // E não mexeram no equilíbrio, que é o que se temia: remedido em 300 lutas de 2º nível depois dos
      // barris — 96% de vitória, 3% de morte de herói, 73% de vida de pé, 4,6 rodadas —, contra os 95,5%,
      // 3,8% e 75% que o comentário de `buildFoes` já media sem eles.
      objetos: [],
      // O grupo vem pela rua, do oeste; os Marcarrubra esperam a leste, na frente do Gigante Adormecido. Todos
      // desceram UMA fileira em relação ao mapa antigo: a rua pintada passa nas fileiras 6 e 7, e as casas 4 e 5
      // caíam dentro da casa de pedra e do telhado da estalagem. A distância entre os dois lados não mudou —
      // os dois blocos desceram juntos —, e é ela que o comentário de `buildFoes` mediu.
      grupo: [{ x: 3, y: 5 }, { x: 3, y: 7 }, { x: 2, y: 6 }, { x: 4, y: 6 }],
      olhar: { dx: 1, dy: 0 },
      // O LAMPIÃO DA VARANDA DO GIGANTE ADORMECIDO. A rua anoitece pelo relógio da vila
      // (`capitulo3-rua.js` chama `definirEscuridao(field, 0.8)` depois do último momento do dia), e MEDIDO
      // antes de pôr isto aqui: as 188 casas livres da rua ficavam TODAS no breu, com zero fontes de luz no
      // mapa — e nenhum dos quatro Marcarrubra tem visão no escuro, porque são humanos. Quatro bandidos
      // bebendo na varanda de uma taverna aberta, às escuras, e depois uma briga em que metade do grupo e o
      // inimigo inteiro lutavam cegos. O texto da provocação sempre descreveu a varanda com gente sentada
      // nela; faltava a luz que isso implica.
      //
      // Um lampião só, em (10,5), na frente da varanda: 15 pés de claro e 30 de penumbra, que acendem a
      // frente da taverna e deixam o resto da rua escuro — a briga continua tendo noite, só deixa de ser cega
      // dos dois lados. De dia não muda nada (sem escuridão, a rua já está clara). E, como toda chama do
      // jogo, dá para apagá-lo pelo botão direito (`game/fogo.js`), o que é uma jogada e não um bug.
      // `soNoEscuro`: ninguém acende lampião de varanda ao meio-dia. De dia ele fica apagado e a rua é a de
      // sempre; quando a escuridão da cena chega, ele acende sozinho (`rules/luz.js`).
      luzes: [{ pos: { x: 10, y: 5 }, claro: 15, penumbra: 30, tipo: 'lanterna', soNoEscuro: true,
        nome: 'o lampião da varanda do Gigante Adormecido' }],
      // O mapa pintado por baixo, nosso, servido de `public/`: 80 px por casa, canto da casa (0,0) no canto da imagem.
      fundo: { nome: 'rua.webp', url: '/mapas/rua.webp', escala: 80, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      cena: 'rua',
    };
  }
  if (variante === 'castelo') {
    // O Castelo Dentefino: o grupo sai da mata pela encosta a oeste do terraço.
    return {
      ...MAPA_CASTELO,
      // As casas de cada sala: o tabuleiro apaga a parede da sala em que o
      // grupo entrou (`board.desenharParedes`).
      salas: CASTELO.celulas,
      folhas: CASTELO.folhas,
      // SOBRE O BATTLEMAP DA FA (Cragmaw Castle 31x22), com a planta REDESENHADA por cima dele
      // (`src/dev/mapa-castelo-fa.py`). A planta antiga, de 39x28, era decalque do mapa do livro, e a prova
      // visual mostrou a nossa parede correndo por fora da parede pintada: mesmo castelo, planta diferente.
      // Então foi o caminho do Cume — adotar a planta deles e medir os pontos nela —, e não o da Mansão, que
      // era a mesma planta e só trocou a imagem. O grupo, as salas e o fio saem todos do gerador.
      //
      // A arte NÃO entra no repositório nem na publicação (licença da FA): sem o arquivo em `public/mapas/fa/`,
      // a cena abre com o ladrilho de laje.
      cena: 'castelo',
      // O FIO DO SALÃO, como REGIÃO (`rules/regioes.js`) — era roteiro do capítulo. Um fio de cobre no entulho diante
      // da porta leste, amarrado a pinos no teto: quem pisa em qualquer casa do corredor derruba meia parede sobre
      // todas elas (Destreza CD 10, 3d6 de concussão, metade em quem passa). O Procurar acha com CD 10; de passagem,
      // só a Percepção passiva 20, a até 3 m. O capítulo conta, dá o XP e acorda o castelo (`capitulo4-castelo.js`).
      regioes: [{
        id: 'fio', nome: 'O fio de cobre do salão', casas: CASTELO.armadilha.map((q) => `${q.x},${q.y}`), quando: ['entrar'], vezes: 1,
        escondida: {
          cd: 10, cdPassiva: 20, alcance: 10,
          achado: 'Um fio fino de cobre, esticado na altura do tornozelo no entulho diante da porta leste, sobe até um teto prestes a cair. Dá para passar por cima sem tocar nele.',
        },
        efeitos: [
          { tipo: 'dano', dados: '3d6', dano: 'concussão', alvo: 'todos', teste: { atributo: 'dex', cd: 10, metade: true } },
          { tipo: 'parar' },
        ],
      }],
    };
  }
  if (variante === 'cume') {
    // O Cume da Wyvern, sobre o battlemap da FA (`game/cume.js`, gerado por `src/dev/mapa-cume-fa.py`): o
    // acampamento orc está DENTRO da caverna, e o grupo chega pelo campo de pedra do sul, de frente para a boca.
    return {
      ...MAPA_CUME,
      objetos: [],
      grupo: CUME.grupo.map((p) => ({ ...p })),
      olhar: { dx: 0, dy: -1 },
      cena: 'cume',
    };
  }
  if (variante === 'arvoreTrovao') {
    // As ruínas de Árvore Trovão: o grupo entra pela rua, vindo do sul, com a
    // torre do dragão no fim dela.
    return {
      ...MAPA_ARVORE_TROVAO,
      // Como no castelo: as casas de cada cômodo (o tabuleiro dissolve a parede
      // do cômodo em que o grupo entrou) e a decoração pendurada nas paredes.
      salas: ARVORE_TROVAO.celulas,
      pisos: ARVORE_TROVAO.pisos,
      folhas: ARVORE_TROVAO.folhas,
      // A BARRICADA DO CULTO (área 13), como REGIÃO. No livro a casa dos cultistas tem porta, trancada por
      // dentro, e o grupo a força com um teste de Força. O battlemap da Forgotten Adventures não dá porta
      // nenhuma a esta construção: ela é uma ruína de alicerce quebrado, 16 arestas abertas e nem uma folha.
      // Medido pelo desenho, aresta a aresta, procurando a pedra do alicerce: não dá para separar o que é
      // muro do que é mato por cima dele (as paredes que existem vão de 4% a 35% de pedra), então não se
      // inventa muro. O que o livro quer — "eles se fecharam, e entrar custa" — vira o que a ruína comporta:
      // Favric entulhou os vãos com o móvel que sobrou, e quem tenta entrar é empurrado de volta até alguém
      // arrastar aquilo (Atletismo CD 20, no lugar do teste de Força do livro).
      regioes: [{
        id: 'barricadaCulto', nome: 'A barricada dos cultistas', quem: 'grupo', quando: ['entrar'],
        casas: ARVORE_TROVAO.celulas.cultistas.map((c) => `${c.x},${c.y}`),
        efeitos: [
          { tipo: 'texto', texto: 'Móveis, vigas e um carroção de mão entulham o vão: não se passa por cima disso andando.' },
          { tipo: 'voltar' },
        ],
      }],
      fachadaFechada: true,
      veuDaEscuridao: 1,
      avisosDeVista: true,
      // A mobilia: cada casa de `prop` diz qual peca do atlas e (`variante`).
      objetos: ARVORE_TROVAO.props.map((p) => ({ ...p })),
      // Do mapa, e não escrito aqui: estas casas já foram as do mapa antigo, e
      // quando ele cresceu o grupo passou a nascer dentro de uma construção.
      grupo: ARVORE_TROVAO.grupo.map((p) => ({ ...p })),
      olhar: { dx: 0, dy: -1 },
      cena: 'arvoreTrovao',
    };
  }
  if (variante === 'ondaEco') {
    // A Caverna Onda Eco (Parte 4): o grupo desce pela entrada do sudoeste, no escuro.
    return {
      ...MAPA_ONDA_ECO,
      salas: ONDA_ECO.salas,
      // O piso de dentro das salas de pedra (a laje lavrada da mina) e o breu: o que o grupo não vê fica PRETO.
      pisos: Object.fromEntries(Object.keys(ONDA_ECO.salas).map((k) => [k, 'lajeMina'])),
      veuDaEscuridao: 1,
      paredeDeCaverna: true,
      degraus: ONDA_ECO.degraus,
      folhas: ONDA_ECO.folhas,
      objetos: ONDA_ECO.props.map((p) => ({ ...p })),
      grupo: ONDA_ECO.grupo.map((p) => ({ ...p })),
      olhar: { dx: 1, dy: -1 },
      // O MAPA PINTADO, de fora do repositório. A nossa planta é um decalque do mapa oficial do Roll20 em DOBRO
      // (duas casas nossas por quadrado pintado), e por isso 73x90 casas; o battlemap da Forgotten Adventures é
      // 73x90 da grade DELE, que cai 1 para 1 na nossa — 100 px por casa, origem cravada, sem enquadrar nada.
      // O encaixe medido é IoU 0,695 (`encaixar-fa.py`): a mesma caverna, plantas desenhadas à parte, então a
      // parede dele não cai exatamente na nossa. Quem manda continua sendo a NOSSA camada de regra.
      // A arte NÃO É NOSSA e não se publica: a licença da FA proíbe embutir em video game, o arquivo fica só no
      // disco de quem o baixou (`/mapas/`, no `.gitignore`) e o build não o leva (`montar-publico.mjs` copia só o
      // que o git conhece). Sem o arquivo, a cena abre com o ladrilho de sempre.
      fundo: { nome: 'ondaeco.webp', url: '/mapas/fa/ondaeco.webp', escala: 100, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      cena: 'ondaEco',
    };
  }
  if (variante === 'poco') {
    // O Poço da Coruja Velha, sobre o battlemap da FA (`game/poco.js`, gerado por `src/dev/mapa-poco-fa.py`):
    // o grupo sobe pela trilha de terra do sul, que é por onde a planta abre. A tenda de Kost está DESENHADA no
    // mapa (x 5..7, y 8..10, com a aba etérea ao sul), então não há sprite de tenda por cima dela.
    return {
      ...MAPA_POCO,
      objetos: [],
      grupo: [{ x: 5, y: 20 }, { x: 6, y: 20 }, { x: 6, y: 19 }, { x: 7, y: 19 }],
      olhar: { dx: 0, dy: -1 },
      cena: 'poco',
    };
  }
  if (variante === 'ermo' || variante === 'ermoNoite') {
    // Encontro na Trilha de Triboar. De dia o grupo vem andando pela trilha; de
    // noite está em volta da fogueira, e o resto do mapa é breu.
    const noite = variante === 'ermoNoite';
    return {
      terreno: noite ? MAPA_ERMO_NOITE : MAPA_ERMO,
      altura: null,
      // A fogueira é a ÚNICA luz da noite, e o desenho por baixo é o do dia: sem este sprite ela não existe na
      // tela, e a cena mostrava quatro heróis parados no escuro em volta de nada. `sobreOFundo` diz ao tabuleiro
      // que este é dos poucos móveis que o mapa pintado não traz.
      objetos: noite ? [{ tipo: 'prop', variante: 'fogueiraPanela', x: 11, y: 5, sobreOFundo: true }] : [],
      grupo: noite
        ? [{ x: 10, y: 5 }, { x: 12, y: 5 }, { x: 11, y: 4 }, { x: 10, y: 4 }]     // em volta da fogueira (11,5), na grama
        : [{ x: 9, y: 6 }, { x: 10, y: 6 }, { x: 9, y: 7 }, { x: 10, y: 7 }],      // na trilha, no alto da curva
      olhar: { dx: 1, dy: 0 },
      cena: 'ermo',
      // O mapa pintado por baixo. É NOSSO, entra no repositório e o Vite o serve de `public/`; já vem cortado
      // na grade, 80 px por casa, com o canto da casa (0,0) no canto da imagem.
      fundo: { nome: 'ermo.webp', url: '/mapas/ermo.webp', escala: 80, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      // A copa e o espinheiro da curva por cima das fichas (ver a Emboscada). Aqui a folha é mais rala — 17,1%
      // da casa na mediana das 40 que encostam em mata —, e nenhuma delas passa de 80%: marcar casa inteira
      // seria errado em todas as quarenta.
      frente: { cor: { verde: 12, escuro: 92 } },
      ...(noite ? { luz: 'escuro', luzes: [{ pos: { x: 11, y: 5 }, claro: 20, penumbra: 20, tipo: 'fogueira' }] } : {}),
    };
  }
  // AS TRÊS LUTAS PEQUENAS DO CAPÍTULO 5 DO OBELISCO, na vila (`obelisco5-lutas.js`), sobre os mapas da FA.
  const LUTAS_CAP5 = { cavernaDoPoco: [MAPA_CAVERNA_DO_POCO, 'CAVERNA_DO_POCO'], acampamentoSawplee: [MAPA_ACAMPAMENTO_SAWPLEE, 'ACAMPAMENTO_SAWPLEE'], telhadoGigante: [MAPA_TELHADO_GIGANTE, 'TELHADO_GIGANTE'], giganteTerreo: [MAPA_GIGANTE_TERREO, 'GIGANTE_TERREO'] };
  if (LUTAS_CAP5[variante]) {
    const [mapa, chave] = LUTAS_CAP5[variante];
    const pt = PONTOS_CAP5_VILA[chave];
    // o térreo do Gigante é exploração (`obelisco5-terreo.js`); as outras três são luta (`obelisco5-lutas.js`)
    return { ...mapa, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: variante === 'giganteTerreo' ? 'gigante5' : 'cap5luta' };
  }
  // O REPOUSO DE ZORZULA (capítulo 5 do Obelisco): o posto (`zorzula-posto.js`) e o Santuário Índigo
  // (`zorzula-santuario.js`), sobre a planta da FA sem a arte (`zorzula-mapas.js`).
  // O CAPÍTULO 6 NA VILA (`obelisco6-lugares.js`): a casa de Marthungrim, a Mina Hardyhammer e o largo da vaca.
  const CAP6 = {
    casaMarthungrim: [MAPA_CASA_MARTHUNGRIM, 'CASA_MARTHUNGRIM'],
    minaHardyhammer: [MAPA_MINA_HARDYHAMMER, 'MINA_HARDYHAMMER'],
    largoDaVaca: [MAPA_LARGO_DA_VACA, 'LARGO_DA_VACA'],
  };
  // O CAPÍTULO 7 NA VILA (`obelisco7-lugares.js`): a briga dos moradores infectados, no mapa do largo.
  // O TÚNEL DO CAPÍTULO 7 (`tunel-cap7.js`): as três cavernas da viagem a Illithinoch.
  const TUNEL7 = { tunelGrells: [MAPA_CAVERNAS_GRELLS, 'CAVERNAS_GRELLS'], tunelBehir: [MAPA_TOCA_BEHIR, 'TOCA_BEHIR'], tunelGruta: [MAPA_GRUTA_TAGARELA, 'GRUTA_TAGARELA'] };
  // ILLITHINOCH (o Obelisco, capítulo 7): a fortaleza dos devoradores de mentes (`illithinoch.js`).
  // AS TRÊS FENDAS DE ILLITHINOCH (`fendas.js`)
  const FENDAS7 = { fendaTrincheiras: [MAPA_TRINCHEIRAS, 'TRINCHEIRAS'], fendaOco: [MAPA_OCO_DA_DESOVA, 'OCO_DA_DESOVA'], fendaLabirinto: [MAPA_LABIRINTO_DOS_OLHOS, 'LABIRINTO_DOS_OLHOS'] };
  if (FENDAS7[variante]) {
    const [mapa, chave] = FENDAS7[variante];
    const pt = PONTOS_FENDAS[chave];
    return { ...mapa, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: 'fenda' };
  }
  // O LABIRINTO SALGADO e o covil do Lowarnizel (o Obelisco, capítulo 8; `labirinto-salgado.js`)
  if (variante === 'labirintoSalgado') {
    return { ...MAPA_LABIRINTO_SALGADO, altura: null, objetos: [], grupo: PONTOS_LABIRINTO.grupo, olhar: PONTOS_LABIRINTO.olhar, cena: 'labirintoSalgado' };
  }
  // AS ILHAS DO VAZIO SEM FIM (`vazio.js`): uma variante por ilha
  const ILHAS_DO_VAZIO = { vazioCupula: 'CUPULA', vazioPonte: 'PONTE', vazioCharco: 'CHARCO', vazioNematodeo: 'NEMATODEO', vazioMiasma: 'MIASMA', vazioEstatua: 'ESTATUA', vazioCampo: 'CAMPO', vazioAnima: 'ANIMA' };
  if (ILHAS_DO_VAZIO[variante]) {
    const k = ILHAS_DO_VAZIO[variante];
    const pt = VAZIO.PONTOS_VAZIO[k];
    return { ...VAZIO[`MAPA_VAZIO_${k}`], altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: 'vazio' };
  }
  if (variante === 'pocaSalgada') {
    return { ...MAPA_POCA, altura: null, objetos: [], grupo: PONTOS_POCA.grupo, olhar: PONTOS_POCA.olhar, cena: 'pocaSalgada' };
  }
  if (variante === 'covilLowarnizel') {
    return { ...MAPA_COVIL_LOWARNIZEL, altura: null, objetos: [], grupo: PONTOS_COVIL.grupo, olhar: PONTOS_COVIL.olhar, cena: 'covilLowarnizel' };
  }
  if (variante === 'illithinoch') {
    return { ...MAPA_ILLITHINOCH, altura: null, objetos: [], grupo: PONTOS_ILLITHINOCH.grupo, olhar: PONTOS_ILLITHINOCH.olhar, cena: 'illithinoch' };
  }
  if (TUNEL7[variante]) {
    const [mapa, chave] = TUNEL7[variante];
    const pt = PONTOS_TUNEL7[chave];
    return { ...mapa, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: 'tunel7' };
  }
  if (variante === 'santuarioInfectado') {
    const pt = PONTOS_CAP7_VILA.SANTUARIO_INFECTADO;
    return { ...MAPA_SANTUARIO_INFECTADO, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: 'cap7lugar' };
  }
  if (CAP6[variante]) {
    const [mapa, chave] = CAP6[variante];
    const pt = PONTOS_CAP6_VILA[chave];
    return { ...mapa, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena: 'cap6lugar' };
  }
  // TALHUNDERETH (o Obelisco, capítulo 6): o templo de Dumathoin tomado pelo culto (`talhundereth.js`).
  // A CRIPTA DOS TALHUND (o Obelisco, capítulo 6), debaixo de Talhundereth (`cripta-talhund.js`).
  if (variante === 'criptaTalhund') {
    return { ...MAPA_CRIPTA, altura: null, objetos: [], grupo: PONTOS_CRIPTA.grupo, olhar: PONTOS_CRIPTA.olhar, cena: 'cripta' };
  }
  if (variante === 'talhundereth') {
    return { ...MAPA_TALHUNDERETH, altura: null, objetos: [], grupo: PONTOS_TALHUNDERETH.grupo, olhar: PONTOS_TALHUNDERETH.olhar, cena: 'talhundereth' };
  }
  // A ENCRUZILHADA DA FORCA (o Obelisco, capítulo 6): o entreposto do Subterrâneo e o terceiro fragmento (`encruzilhada.js`).
  // A porta reforçada de G11 está barrada do lado de lá: vinda de G10, ferramentas de ladrão CD 15 ou Atletismo CD 21.
  if (variante === 'encruzilhada') {
    return { ...MAPA_ENCRUZILHADA, altura: null, objetos: [], grupo: PONTOS_ENCRUZILHADA.grupo, olhar: PONTOS_ENCRUZILHADA.olhar,
      trancas: [{ aresta: PONTOS_ENCRUZILHADA.portaBarrada.aresta, cd: 15, forca: 21 }], cena: 'encruzilhada' };
  }
  const ZORZULA = {
    zorzulaPosto: [MAPA_ZORZULA_POSTO, 'ZORZULA_POSTO', 'zorzula'],
    zorzulaMinas: [MAPA_ZORZULA_MINAS, 'ZORZULA_MINAS', 'minas'],
    santuarioIndigo: [MAPA_ZORZULA_SANTUARIO, 'ZORZULA_SANTUARIO', 'santuario'],
  };
  if (ZORZULA[variante]) {
    const [mapa, chave, cena] = ZORZULA[variante];
    const pt = PONTOS_ZORZULA[chave];
    return { ...mapa, altura: null, objetos: [], grupo: pt.grupo, olhar: pt.olhar, cena };
  }
  if (variante === 'covilAgatha') {
    // A CABANA DA AGATHA (Conyberry): uma clareira na mata com a casinha de galhos trançados no meio — as árvores
    // vergadas são a parede (`T`), a porta baixa é o vão de duas casas ao sul, e dentro há a mesa posta e os dois
    // baús. O grupo está dentro, onde a conversa acabou; ela surge no canto do fundo (`capitulo4-agatha.js`).
    return {
      terreno: [
        'TTTTTTTTTTTTTTTT',
        'TT,,,,,,,,,,,,TT',
        'T,,,,TTTTTT,,,,T',
        'T,,,TT....TT,,,T',
        'T,,,T..m...T,,,T',
        'T,,,T.....KT,,,T',
        'T,,,T......T,,,T',
        'T,,,T.K....T,,,T',
        'T,,,TT....TT,,,T',
        'T,,,,TT..TT,,,,T',
        'T,,,,,,,,,,,,,,T',
        'T,,,,,,,,,,,,,,T',
        'TT,,,,,,,,,,,,TT',
        'TTTTTTTTTTTTTTTT',
      ],
      altura: null,
      objetos: [],
      grupo: [{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 }],
      olhar: { dx: 0, dy: -1 },
      // o que a visita descreve (`conyberry.js`), para olhar de graça no meio da luta
      interativos: [
        { x: 7, y: 4, id: 'mesaDaAgatha', rotulo: 'Olhar a mesa', texto: 'Pratos, copos e talheres de madeira clara, cada um no lugar, sem um grão de poeira em cima. A mesa está posta para alguém que não vem há cem anos.' },
        { x: 10, y: 5, id: 'bauDaAgatha', rotulo: 'Olhar o baú', texto: 'Um baú fechado, de madeira clara entalhada com folhas e pássaros. É frio ao toque, como pedra no inverno.' },
        { x: 6, y: 7, id: 'bauDaAgatha2', rotulo: 'Olhar o baú', texto: 'O outro baú, gêmeo do primeiro. Na tampa, o entalhe de um rosto de mulher, gasto de tanto alguém passar a mão.' },
      ],
      cena: 'agatha',
    };
  }
  if (variante === 'editor') {
    // O que se montou em /editor.html. Só a cena 'editor' (exploração livre) vale: um JSON importado não escolhe cena de aventura.
    const m = lerMapaDoEditor() ?? mapaVazioDoEditor();
    const { cena, ...resto } = m;
    return cena === 'editor' ? { ...resto, cena } : resto;
  }
  if (variante === 'casaDaMorte1') return MAPA_CASA_DA_MORTE_1;
  if (variante === 'casaDaMorte2') return MAPA_CASA_DA_MORTE_2;
  if (variante === 'casaDaMorte3') return MAPA_CASA_DA_MORTE_3;
  if (variante === 'casaDaMorte4') return MAPA_CASA_DA_MORTE_4;
  if (variante === 'casaDaMortePorao1') return MAPA_CASA_DA_MORTE_PORAO_1;
  if (variante === 'casaDaMortePorao2') return MAPA_CASA_DA_MORTE_PORAO_2;
  if (variante === 'mansao' || variante === 'mansaoTunel') {
    // O esconderijo dos Marcarrubra embaixo da Mansão Tresendar. Pela escada
    // da cozinha (área 1, a leste) ou pelo túnel que o Carp achou (área 8, ao
    // sul, saindo do mato).
    const tunel = variante === 'mansaoTunel';
    return {
      ...MAPA_MANSAO,
      // Cada cômodo com a sua tinta no tabuleiro, como no castelo; a parede fina (de borda) do cômodo onde o grupo está se dissolve.
      salas: MANSAO.salas,
      paredeDeCaverna: true,      // a pedra em volta é parede de caverna (3 níveis), e não um degrau
      cliqueNoObjeto: true,       // o botão direito no corpo de um objeto (barril, baú, estante) acha o objeto, e não a casa de trás
      rochaEmCorte: true,         // ... exceto a que fica na frente de uma sala: essa fica baixa, para se ver dentro
      decor: MANSAO.decor,        // candeeiros nas arestas das paredes de trás
      folhas: MANSAO.folhas,      // as portas que têm folha de madeira
      grades: MANSAO.grades,      // as arestas de barra que são grade de ferro (as celas)
      // As duas pontes cruzam a fenda de leste a oeste.
      objetos: [
        ...Object.values(MANSAO.pontes).map((y) => ({ tipo: 'ponte', x: MANSAO.fenda[y][0], y, olha: { dx: 1, dy: 0 }, fundo: 'entulho' })),
        ...MANSAO.props,           // a mobília de arte própria (estantes, bancada, cabides...), por casa
      ],
      degraus: MANSAO.degraus,     // as casas de escada
      // AS DUAS ARMADILHAS, como REGIÕES (`rules/regioes.js`) — eram roteiro do capítulo, que hoje só conta e lembra.
      // O fosso coberto do corredor (área 3): lajes falsas sobre um buraco de seis metros, de parede a parede. Quem pisa
      // testa Destreza CD 15: passando, agarra a beirada; falhando, cai (2d6) e fica no chão. Nos dois casos volta para o
      // lado de onde veio, e o buraco abre (`capitulo3-mansao.js marcarFosso`). Só se acha procurando (CD 15).
      // A ponte do sul (área 8): podre por baixo, cede com qualquer um em cima, e todos nela caem seis metros no entulho
      // (2d6, no chão). Vê-se a ponte, não o podre: a régua não avisa (`discreta`); o "Examinar a ponte" avisa.
      regioes: [
        {
          id: 'fosso', nome: 'O fosso coberto do corredor', casas: MANSAO.fosso.map((q) => `${q.x},${q.y}`), quando: ['entrar'], vezes: 1,
          escondida: {
            cd: 15, passiva: false,
            achado: 'As lajes do meio do corredor não assentam: por baixo, um fosso fundo, de parede a parede. Dá para se espremer pela beirada, ou saltar por cima.',
          },
          efeitos: [
            { tipo: 'dano', dados: '2d6', dano: 'concussão', teste: { atributo: 'dex', cd: 15 }, seFalhar: 'caido' },
            { tipo: 'voltar' },
          ],
        },
        {
          id: 'ponteSul', nome: 'A ponte do sul', discreta: true, quando: ['entrar'], vezes: 1,
          casas: (() => { const y = MANSAO.pontes.sul; const [x0, x1] = MANSAO.fenda[y]; return Array.from({ length: x1 - x0 + 1 }, (_, i) => `${x0 + i},${y}`); })(),
          efeitos: [
            { tipo: 'dano', dados: '2d6', dano: 'concussão', alvo: 'todos' },
            { tipo: 'condicao', condicao: 'caido', alvo: 'todos' },
            { tipo: 'parar' },
          ],
        },
      ],
      grupo: tunel
        ? [{ x: 10, y: 19 }, { x: 10, y: 18 }, { x: 10, y: 17 }, { x: 10, y: 16 }]
        : [{ x: 29, y: 14 }, { x: 28, y: 14 }, { x: 27, y: 14 }, { x: 27, y: 15 }],
      olhar: tunel ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 },
      // O BATTLEMAP DA FORGOTTEN ADVENTURES por baixo (Redbrand Hideout 30x20, versão apagada e sem grade: o
      // jogo acende a luz e desenha a grade). A NOSSA PLANTA NÃO FOI REFEITA, e de propósito: ela é decalque do
      // mapa oficial do Roll20, e a da FA saiu do mesmo mapa, então as duas batem 1 para 1 — 100 px por casa,
      // origem (0,0), sem enquadrar nada. Medido: a casa que a nossa regra bloqueia tem brilho médio 16 no
      // desenho, e a de chão, 39; parede cai em parede. Refazer a planta daria a mesma planta e derrubaria as
      // portas, as secretas, as grades e os 1.700 de roteiro que vivem em cima dela.
      // O que mudou foi a IMAGEM: a de antes era um HOTLINK para o CDN do Roll20 (68,267 px por casa, servido
      // da banda deles a quem jogasse). Esta fica no disco de quem a baixou, em 100 px por casa.
      // O arquivo fica FORA do versionamento (`.gitignore`): a licença da FA proíbe embutir a arte deles em
      // video game. Sem ele, o tabuleiro desenha o chão de sempre.
      fundo: { nome: 'mansao.jpg', url: '/mapas/fa/mansao.jpg', escala: 100, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      cena: 'mansao',
      entrada: tunel ? 'tunel' : 'cozinha',
    };
  }
  if (variante === 'esconderijo') {
    return {
      ...MAPA_ESCONDERIJO,
      paredeDeCaverna: true,
      // O mato fechado do posto dos vigias: quem ataca através dele tem três quartos de cobertura (H1/H2).
      espinheiroCobre: true,          // a rocha junto do chão é parede de verdade (3 níveis), e não um degrau de 22 px
      // A ponte cruza o canal na diagonal, de noroeste para sudeste, como o desenho da FA a põe.
      objetos: [{ tipo: 'ponte', x: 15, y: 4, olha: { dx: 1, dy: 1 } }],
      // O grupo chega pela trilha dos goblins, pelo oeste da clareira da área 1.
      grupo: [{ x: 1, y: 16 }, { x: 2, y: 16 }, { x: 1, y: 17 }, { x: 2, y: 17 }],
      olhar: { dx: 1, dy: -1 },
      // As duas fogueiras: a da comida no covil e a de Klarg. Cada uma leva a SOBREPOSIÇÃO do cômodo aceso — a
      // pintura da FA com o fogo dando cor à sala —, e quem apaga a fogueira apaga as duas coisas juntas: a luz
      // que a regra conta e a cor que o desenho mostra (`game/fogo.js`).
      luzes: [
        { pos: { x: 3, y: 6 }, claro: 15, penumbra: 15, tipo: 'fogueira', sobreposicao: 'fogoDoCovil', nome: 'a fogueira do covil' },
        { pos: { x: 23, y: 13 }, claro: 10, penumbra: 10, tipo: 'fogueira', sobreposicao: 'fogoDeKlarg', nome: 'a fogueira de Klarg' },
      ],
      // O BATTLEMAP DA FORGOTTEN ADVENTURES por baixo (Cragmaw Hideout 30x20, release grátis, versão sem
      // fogueira acesa e sem grade: o jogo acende a luz e desenha a grade). A planta deste capítulo é a DELE: o
      // traçado das paredes veio da cena do Foundry, e a escala é a da imagem, 100 px por casa, sem desvio.
      // O arquivo fica FORA do versionamento (ver `.gitignore`): a licença da FA proíbe embutir a arte deles em
      // video game, então ela roda na máquina de quem a baixou. Sem o arquivo, o tabuleiro desenha o chão de sempre.
      fundo: { nome: 'esconderijo-fa.webp', url: '/mapas/esconderijo-fa.webp', escala: 100, x0: 0, y0: 0, giro: 0, opacidade: 1 },
      // AS PEÇAS DA ARTE QUE MUDAM COM A HISTÓRIA, todas do pacote da FA e todas na casa onde a cena do Foundry as
      // põe. O capítulo as acende quando a coisa acontece: o fogo aceso de cada cômodo, o ressalto que desaba, o
      // baú que se abre, a ponte que cai, e as duas barragens dos tanques que estouram.
      sobreposicoes: [
        { id: 'fogoDoCovil', url: '/mapas/fa/LightDen.webp', x: 1, y: 3, w: 8, h: 6, ligada: true },
        { id: 'fogoDeKlarg', url: '/mapas/fa/LightCave.webp', x: 19, y: 8, w: 10, h: 10, ligada: true },
        { id: 'ressaltoCaido', url: '/mapas/fa/Collapse.webp', x: 8, y: 5, w: 4, h: 3 },
        { id: 'bauAberto', url: '/mapas/fa/ChestOpen.webp', x: 26, y: 15, w: 2, h: 2 },
        { id: 'ponteCaida', url: '/mapas/fa/BridgeBreak.webp', x: 12, y: 4, w: 5, h: 7, frente: true },
        { id: 'diqueRompido1', url: '/mapas/fa/FirstBreak.webp', x: 21, y: 3, w: 3, h: 3 },
        { id: 'diqueRompido2', url: '/mapas/fa/SecondBreak.webp', x: 23, y: 3, w: 4, h: 5 },
      ],
      // A LAJE INSTÁVEL DO RESSALTO (área 4), como o Obelisco a põe: não é armadilha escondida, é chão ruim que se
      // vê. Quem do grupo anda em cima dela — ou ataca corpo a corpo de cima dela (`capitulo2.js`, evento `attack`) —
      // faz Acrobacia CD 10 (`gatilho`); falhou, a massa inteira se solta e cai para leste: quem disparou, a cobra e
      // quem estiver na metade leste da passagem fazem Destreza CD 10, 2d6 de concussão e caídos na falha, metade e
      // de pé no sucesso. O desenho do desabamento acende. Uma vez só: caída, não há mais laje.
      regioes: [{
        id: 'ressalto', nome: 'a laje do ressalto', casas: PONTOS_DO_ESCONDERIJO.ressalto.map((p) => `${p.x},${p.y}`),
        vezes: 1, quem: 'grupo', gatilho: { pericia: 'acrobacia', cd: 10 },
        efeitos: [
          { tipo: 'sobreposicao', id: 'ressaltoCaido', ligada: true },
          { tipo: 'dano', dados: '2d6', dano: 'concussão', teste: { atributo: 'dex', cd: 10, metade: true }, seFalhar: 'caido',
            alvo: 'todos', casas: [...PONTOS_DO_ESCONDERIJO.ressalto.map((p) => `${p.x},${p.y}`), '11,6'] },
        ],
      }],
      cena: 'esconderijo',
    };
  }
  // A vitrine de tamanhos e o simulador, os dois na arena. Explícito: antes qualquer variante desconhecida caía
  // aqui por descuido, e `mapaDo('cachorro')` devolvia um mapa como se nada fosse.
  if (variante === 'grandes' || variante === 'arena') {
    return { terreno: MAPA_ARENA, altura: null, grupo: PARTIDA_ARENA, olhar: { dx: 1, dy: -1 } };
  }
  throw new Error(`mapaDo: não existe a cena "${variante}"`);
}

/**
 * Inimigos presentes desde o começo.
 *
 * Orçamento pelo DMG, para 4 personagens de 2º nível:
 *   fácil 200 · médio 400 · difícil 600 · mortal 800 (XP ajustado)
 */
/**
 * @param {string} variante  a cena. 'arena' é a bancada do simulador (`MAPA_ARENA`), com o bando que o
 *   `balance.js` mede desde sempre; 'grandes' é a mesma arena com as criaturas que ocupam mais de um quadrado,
 *   para VER pegada e alcance — trocar a composição da arena só para exibir isso estragaria a série de medidas.
 */
export function buildFoes(variante = 'arena') {
  // Os da estrada e do Poço saem da cena (o sorteio do encontro e o livro).
  if (['ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'editor', 'covilAgatha', 'cavernaDoPoco', 'acampamentoSawplee', 'telhadoGigante', 'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo', 'casaMarthungrim', 'minaHardyhammer', 'largoDaVaca', 'santuarioInfectado', 'tunelGrells', 'tunelBehir', 'tunelGruta', 'illithinoch', 'fendaTrincheiras', 'fendaOco', 'fendaLabirinto', 'labirintoSalgado', 'covilLowarnizel', 'pocaSalgada', 'vazioCupula', 'vazioPonte', 'vazioCharco', 'vazioNematodeo', 'vazioMiasma', 'vazioEstatua', 'vazioCampo', 'vazioAnima', 'talhundereth', 'criptaTalhund', 'encruzilhada'].includes(variante)) return [];
  if (variante.startsWith('casaDaMorte')) return foesDaCasa(variante);
  if (variante === 'grandes') return foesGrandes();
  if (variante === 'emboscada') return foesEmboscada();
  if (variante === 'esconderijo') return foesEsconderijo();
  if (variante === 'mansao' || variante === 'mansaoTunel') return foesMansao();
  if (variante === 'rua') {
    // Quatro bandidos Marcarrubra, na frente da taverna. Eles ficavam em
    // x17-19, a 65-80 pés do grupo, e como só têm espada curta levavam dois
    // turnos para chegar: a briga media 98% de vitória e 13% de PV perdidos,
    // apesar de 800 de XP ajustado ("mortal" no 2º nível). Cinco casas mais a
    // oeste dão contato na segunda rodada. Medido depois, já com o bloco novo
    // (mais fraco que o antigo): a 5 casas a briga ficava em 99% de vitória e
    // 17% de PV; a 6 casas fica em 95,5%, 3,8% de morte de herói e 25% de PV —
    // a abertura do capítulo com dentes, sem virar cara ou coroa (a 7 casas
    // não melhora mais nada: 94% e 26%).
    const foes = [[11, 5], [12, 6], [11, 7], [13, 6]].map(([x, y], i) => {
      const f = makeMonster('marcarrubra', { x, y }, { nameSuffix: 'ABCD'[i] });
      f.facingVec = { dx: -1, dy: 0 };
      return f;
    });
    return foes;
  }
  if (variante !== 'arena') throw new Error(`buildFoes: não existe a cena "${variante}"`);
  // O BANDO DA ARENA, que o `balance.js` mede desde o começo do projeto. Mexer aqui invalida a série inteira.
  const foes = [
    makeMonster('goblinChefe', { x: 12, y: 2 }),
    // O goblin fica COLADO no chefe de propósito: Redirecionar Ataque só
    // funciona com um capanga adjacente. Sem ele, a reação do chefe é letra
    // morta e o grupo nunca descobre que ela existe.
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    // O hobgoblin vai na frente, no chão: CA 18 faz dele o melhor bloqueador,
    // e é ele que o grupo encontra primeiro ao contornar o paredão.
    makeMonster('hobgoblin', { x: 10, y: 2 }, { nameSuffix: 'A' }),
    makeMonster('lobo', { x: 11, y: 6 }, { nameSuffix: 'cinzento' }),
  ];
  for (const f of foes) f.facingVec = { dx: -1, dy: 1 };
  return foes;
}

/**
 * Reforços: chegam depois, pela borda do mapa.
 *
 * Existem porque, com iniciativa por lado, o grupo que vence a iniciativa
 * despacha metade do inimigo antes de qualquer um deles agir. Um bando que
 * chega na rodada 2 e outro na 4 impedem o combate de ser decidido na abertura
 * e dão forma ao encontro: aguentar, respirar, aguentar de novo.
 */
/**
 * O esconderijo, sala por sala. Cada criatura leva o `grupo` dela: a cena do
 * capítulo 2 só põe um grupo no tabuleiro quando ele é visto ou nota o grupo
 * de heróis, e a luta acaba quando AQUELE grupo cai — o resto continua onde
 * estava, esperando.
 */
function foesEsconderijo() {
  const m = (id, x, y, grupo, sufixo = '', olha = { dx: 0, dy: 1 }, opcoes = {}) => {
    const f = makeMonster(id, { x, y }, { nameSuffix: sufixo, ...opcoes });
    f.grupo = grupo;
    f.facingVec = olha;
    return f;
  };
  // As casas são as do battlemap da FA (`game/esconderijo.js`, gerado por `src/dev/mapa-esconderijo-fa.mjs`); quem
  // está onde segue o de-para do livro em `revisoes/esconderijo-de-para-2026-11-04.md`.
  // Área 6: Sildar amarrado na parte de cima (sul) do covil, com 1 PV.
  const sildar = makeNpc('sildar', { x: 4, y: 10 }, { side: 'neutro' });
  sildar.hp = 1;
  sildar.grupo = 'covil';
  sildar.refem = true;
  // O Yeemik do Obelisco é um chefe goblin de bloco cheio (21 PV); a Mina lhe dava 12.
  const yeemik = m('yeemik', 5, 9, 'covil', '', { dx: 0, dy: -1 });
  // O ERRK, o outro chefe goblin do covil no Obelisco, em cima, ao lado do Yeemik.
  const errk = Object.assign(m('goblinChefe', 6, 9, 'covil', '', { dx: 0, dy: -1 }), { name: 'Errk', tesouro: 'errk' });
  const klargLobo = m('lobo', 26, 13, 'chefe', '', { dx: -1, dy: -1 });
  klargLobo.name = 'Serrote';
  return [
    // Área 2: dois vigias no abrigo de ripas desenhado em (13,16)–(14,17), de olho no riacho e na boca.
    m('goblin', 13, 16, 'vigias', 'vigia', { dx: -1, dy: -1 }, { arma: 'Arco curto' }),
    m('goblin', 14, 17, 'vigias', 'vigia', { dx: -1, dy: -1 }, { arma: 'Arco curto' }),
    // O Obelisco põe um CHEFE GOBLIN no posto, com os dois. Caído ele, os outros correm para soltar os lobos do
    // canil (`capitulo2.js`). A bolsa dele: 16 pp.
    Object.assign(m('goblinChefe', 13, 17, 'vigias', 'do posto', { dx: -1, dy: -1 }), { chefeDoPosto: true, tesouro: 'chefeDoPosto' }),
    // Área 3: três lobos acorrentados ao espeto ao pé da estalagmite desenhada em (15,10). O canil da FA é mais
    // estreito que o nosso antigo: com o espeto em (16,11) e 5 pés de corrente, a mordida alcança até x 14, e os
    // degraus da entrada (x 13) ficam fora — o livro diz que eles não alcançam os degraus.
    ...[[16, 10], [17, 11], [16, 12]].map(([x, y]) => Object.assign(
      m('lobo', x, y, 'canil', 'do canil', { dx: -1, dy: 0 }),
      { corrente: { x: 16, y: 11, raioFt: 5 } })),
    // Área 4: a COBRA do Obelisco — uma cobra venenosa gigante enrolada na laje rachada, no meio da subida de
    // entulho. Não estava na Mina; o Obelisco a pôs ali, e a passagem do oeste deixou de ser só o caminho dos fundos.
    m('cobraVenenosaGigante', 9, 6, 'cobra', '', { dx: 1, dy: 0 }),
    // Área 5: um goblin escondido na ponte, vigiando o riacho lá embaixo.
    m('goblin', 16, 5, 'ponte', 'da ponte', { dx: -1, dy: 1 }, { arma: 'Arco curto' }),
    // Área 6: quatro goblins junto ao fogo, na parte de baixo; Yeemik em cima. ERAM CINCO, como no livro, e
    // com o bloco de ND 1 do Yeemik isso dava 900 de XP ajustado — "mortal" para quatro de 2º nível. Os
    // números que justificavam o corte (18% de derrota com cinco, 95,5% de vitória com quatro) eram da planta
    // ANTERIOR, de 40×28, aposentada quando o esconderijo passou para o battlemap da FA.
    //
    // REMEDIDO no mapa de hoje, 300 lutas por coluna, grupo de 2º nível chegando pela entrada leste, as
    // mesmas sementes, com o Sildar amarrado em cena (`node --import ./src/dev/cena-node/register.mjs
    // src/dev/medir-covil.mjs 300 2 [--livro]`):
    //
    //                        nosso (4 + Yeemik)    livro (5 + Yeemik)
    //    vitórias do grupo           94%                   84%
    //    DERROTAS                     6%                   16%
    //    alguma morte                 5%                   10%
    //    alguém a 0 PV               20%                   39%
    //    rodadas                     5,9                   7,6
    //    vida que sobra              70%                   56%
    //
    // A planta mudou e o achado continuava valendo: o quinto goblin TRIPLICAVA a derrota. Ficou em quatro até
    // 2026-11-08, quando o dono do jogo mandou aplicar o Obelisco inteiro: o covil do Obelisco é CINCO goblins e
    // DOIS chefes (o Yeemik de 21 PV e o Errk). Medido assim (`medir-covil.mjs 300 2 --obelisco`): 25% de
    // derrota no 2º nível, contra 1% do covil de quatro. É o livro, e é decisão do dono.
    // Em volta da fogueira de cozinha em (3,6), na parte de baixo, junto da entrada.
    m('goblin', 4, 5, 'covil', 'do covil', { dx: 1, dy: 0 }),
    m('goblin', 5, 5, 'covil', 'do covil', { dx: 1, dy: 1 }),
    m('goblin', 5, 6, 'covil', 'do covil', { dx: 1, dy: 0 }),
    m('goblin', 4, 7, 'covil', 'do covil', { dx: 1, dy: -1 }),
    m('goblin', 3, 7, 'covil', 'do covil', { dx: 1, dy: -1 }),
    yeemik,
    errk,
    sildar,
    // Área 7: três goblins na margem sul dos tanques, entre o dique e a saída para Klarg.
    m('goblin', 22, 7, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('goblin', 25, 7, 'pocos', 'dos poços', { dx: -1, dy: 0 }, { tatica: 'atirador', arma: 'Arco curto' }),
    m('goblin', 26, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    // O Obelisco põe DOIS LOBOS com os goblins dos poços.
    m('lobo', 23, 8, 'pocos', 'dos poços', { dx: -1, dy: 0 }),
    m('lobo', 24, 8, 'pocos', 'dos poços B', { dx: -1, dy: 0 }),
    // Área 8: Klarg, o lobo Serrote e dois goblins.
    // Klarg espera FORA DA VISTA da soleira, encostado na estalagmite desenhada em (28,13). Medido: nesta caverna
    // não há casa com meia cobertura de quem entra pela soleira (24,10)/(25,10) — ou se vê tudo, ou nada —, então
    // o equivalente fiel de "atrás de uma estalagmite" é a casa que a soleira não enxerga. E ele fica a 30 pés da
    // chaminé, como ficava a 15 na planta antiga: fugir por ela custa um turno, não é instantâneo.
    m('klarg', 27, 13, 'chefe', '', { dx: -1, dy: -1 }),
    klargLobo,
    // Os dois goblins de guarda, um de cada lado da soleira, nos cantos que nem ela nem os tanques enxergam.
    // Em (24,15) um deles se via da coluna x 24 dos tanques inteira, reto pelo funil da soleira, e a luta de Klarg
    // começava de dentro dos tanques. Em (26,14) e (26,15) a aresta em degrau os escondia; desde que a visão segue
    // o traço da FA (`grid.hasLineOfSight`), a reta passa pelo corredor e cinco casas dos tanques os viam. Medido:
    // com a visão pela geometria, só quatro casas da caverna ficam fora da vista dos tanques — 22,11, 26,13, 27,12
    // e 27,13 —, e as quatro estão fora da vista da soleira também.
    m('goblin', 22, 11, 'chefe', 'de Klarg', { dx: 1, dy: -1 }),
    m('goblin', 27, 12, 'chefe', 'de Klarg', { dx: -1, dy: -1 }),
  ];
}

/**
 * O esconderijo dos Marcarrubra, sala a sala (Parte 2 da aventura). Cada
 * grupo só entra no tabuleiro quando a cena o chama (`capitulo3-mansao.js`).
 */
function foesMansao() {
  const m = (id, x, y, grupo, sufixo = '', olha = { dx: 0, dy: 1 }) => {
    const f = makeMonster(id, { x, y }, { nameSuffix: sufixo });
    f.grupo = grupo;
    f.facingVec = olha;
    return f;
  };
  // `look`: cada um dos Dendrar tem o PROPRIO desenho (o bloco e o do plebeu).
  const neutro = (f, nome, look = null) => Object.assign(f, { side: 'neutro', name: nome, ...(look ? { look } : {}) });
  // Área 5: a família Dendrar presa nas jaulas.
  const presos = [
    neutro(m('plebeu', 22, 2, 'jaulas'), 'Nars Dendrar', 'nars'),
    neutro(m('plebeu', 21, 7, 'jaulas'), 'Mirna Dendrar', 'mirna'),
    neutro(m('plebeu', 22, 7, 'jaulas'), 'Nilsa Dendrar', 'nilsa'),
  ];
  // `refem`: a 0 PV cai desacordado em vez de morrer (ver `applyDamage`). Sem
  // isso, um plebeu de 4 PV dentro da jaula morria do Mãos Flamejantes do
  // próprio grupo — medido, a família morria em 4 das 14 posições de onde um
  // mago pegaria os dois guardas, e o Sono adormecia um deles em 100 de 100.
  for (const p of presos) { p.preso = true; p.refem = true; p.attacks = []; }
  // Área 9: Nosk, o chefe dos bugbears, com o tapa-olho e a chave.
  const mosk = m('bugbear', 4, 17, 'guardas', '', { dx: 0, dy: -1 });
  mosk.name = 'Nosk';
  mosk.chave = true;
  const droop = neutro(m('droop', 4, 15, 'guardas', '', { dx: 0, dy: 1 }), 'Droop');
  // O Droop desmaia de medo quando a luta começa, e inconsciente ele falha
  // sozinho em toda resistência de Destreza: sem `refem`, um Mãos Flamejantes
  // mirado no Nosk o matava em 182 de 200 lances.
  droop.refem = true;
  // Área 12: o Cajavidro na escrivaninha, de costas para a passagem secreta;
  // o familiar dele vigia a oficina (11). Ninguém sabe o nome dele até ele falar.
  const iarno = makeNpc('iarno', { x: 8, y: 2 }, {});
  iarno.grupo = 'cajavidro';
  iarno.name = 'Cajavidro';
  iarno.facingVec = { dx: -1, dy: 0 };
  iarno.chave = true;
  // Área 11: ZEOND, o quasit do Cajavidro. É o Obelisco: na Mina o familiar era um rato de 1 PV, e o Obelisco pôs no
  // lugar um diabinho que fica invisível e fala. O papel é o mesmo, o alarme da oficina; o que muda é que ele LUTA
  // ao lado do mestre se o grupo chegar ao quarto sem passar por ele (a passagem secreta do 7). Neutro até lá: na
  // oficina ele não ataca, vai avisar. `naoSeguraALuta`: invisível, ele não pode manter a luta aberta sozinho
  // (`combat.js checkEnd`). NÃO leva `familiar: true` — essa marca é a do familiar DO GRUPO (`rules/familiar.js`), e o
  // rato antigo a levava, o que deixava as magias de fora tratá-lo como bicho de um herói.
  const zeond = neutro(m('quasit', 4, 4, 'familiar', '', { dx: 1, dy: 0 }), 'Zeond');
  Object.assign(zeond, { familiarDoMago: true, naoSeguraALuta: true });
  // Área 10: quatro bêbados no jogo de pedrinhas — dois Rufiões Marcarrubra e dois bandidos (o Obelisco).
  const estar = [[3, 9, 0, -1], [4, 9, 0, -1], [5, 8, -1, 0], [2, 8, 1, 0]]
    .map(([x, y, dx, dy], i) => m(i < 2 ? 'marcarrubra' : 'bandido', x, y, 'estar', 'da mesa ' + 'ABCD'[i], { dx, dy }));
  return [
    // Área 2: três BANDIDOS de folga no alojamento (o Obelisco; na Mina eram Rufiões).
    m('bandido', 17, 13, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    m('bandido', 17, 14, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    m('bandido', 17, 12, 'alojamento', 'do beliche', { dx: 1, dy: 0 }),
    // Área 4: SEIS esqueletos encostados nas paredes da cripta, como guardas (o Obelisco; na Mina, três).
    m('esqueleto', 17, 6, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 17, 9, 'cripta', 'da cripta', { dx: 1, dy: 0 }),
    m('esqueleto', 18, 7, 'cripta', 'da cripta', { dx: -1, dy: 0 }),
    m('esqueleto', 16, 5, 'cripta', 'da cripta', { dx: 1, dy: 1 }),
    m('esqueleto', 19, 5, 'cripta', 'da cripta', { dx: -1, dy: 1 }),
    m('esqueleto', 19, 10, 'cripta', 'da cripta', { dx: -1, dy: -1 }),
    // Área 5: TRÊS Rufiões Marcarrubra de guarda nas jaulas (o Obelisco; na Mina, dois).
    m('marcarrubra', 21, 4, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    m('marcarrubra', 21, 5, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    m('marcarrubra', 21, 6, 'jaulas', 'das jaulas', { dx: -1, dy: 0 }),
    ...presos,
    // Área 8: o vigia de um olho só, encolhido junto da coluna do oeste.
    m('vigiaCiclopico', 9, 12, 'fenda', '', { dx: 1, dy: 0 }),
    // Área 9: QUATRO bugbears, todos de pé, e o goblin Droop (o Obelisco). Na nossa cena eram três, com um dormindo
    // até a quarta rodada — decisão de equilíbrio nossa, que o dono trocou pelo livro em 2026-11-08.
    mosk,
    m('bugbear', 3, 16, 'guardas', 'da porta', { dx: 0, dy: -1 }),
    m('bugbear', 5, 17, 'guardas', 'do beliche', { dx: -1, dy: -1 }),
    m('bugbear', 5, 16, 'guardas', 'da mesa', { dx: -1, dy: 0 }),
    droop,
    ...estar,
    iarno,
    // O QUARTO É DELE SÓ, como no livro (Mina e Obelisco). Até 2026-11-08 havia dois guarda-costas nossos: o chefe
    // sozinho, com o bloco do mago maligno da Mina, morria antes de agir em 40 a 63% das lutas. O bloco do Obelisco
    // (dois Estouros Chocantes por turno, Teleporte, Escudo) é outro, e o dono mandou aplicar o livro.
    zeond,
  ];
}

/** Vitrine de tamanho: Médio, Grande e Grande de novo, lado a lado. */
function foesGrandes() {
  const foes = [
    makeMonster('goblin', { x: 12, y: 1 }, { nameSuffix: 'A' }),
    makeMonster('ogro', { x: 10, y: 2 }),
    makeMonster('loboAtroz', { x: 11, y: 6 }, { nameSuffix: 'da matilha' }),
    makeMonster('aranhaGigante', { x: 13, y: 3 }),
    makeMonster('gelatinaOcre', { x: 13, y: 8 }),
    makeMonster('espectro', { x: 9, y: 9 }),
    makeMonster('wraith', { x: 7, y: 9 }),
    makeMonster('caveiraCandente', { x: 5, y: 9 }),
    makeMonster('spectator', { x: 12, y: 10 }),
    makeMonster('galhoInfectado', { x: 3, y: 2 }),
    makeMonster('espetoInfectado', { x: 5, y: 2 }),
    makeMonster('vinhaInfectada', { x: 8, y: 2 }),
    makeMonster('dragaoVerdeJovem', { x: 10, y: 6 }),
    makeMonster('acolito', { x: 3, y: 5 }),
    makeMonster('sacerdote', { x: 6, y: 7 }),
  ];
  for (const f of foes) f.facingVec = { dx: -1, dy: 1 };
  return foes;
}

/**
 * Quatro goblins no alto dos barrancos, dois de cada lado, entre a carroça e
 * os cavalos mortos — é ali que o grupo fica entre os dois fogos.
 *
 * AS POSIÇÕES VIERAM DE MIL COMBATES SIMULADOS (revisor de encontro). As
 * primeiras deixavam B e D a 90–100 pés, em alcance longo com desvantagem, e B
 * nem enxergava a guerreira. Agora os quatro estão no nível 1, com visão dos
 * quatro personagens e em alcance curto do arco (35 a 75 pés).
 *
 * A–B e C–D ficam a 4 casas um do outro de propósito: um Sono (esfera de 20
 * pés) pega dois goblins, e essa é a jogada boa do mago no primeiro turno.
 *
 * ORÇAMENTO DO DMG para 4 personagens de 2º nível: 4 goblins são 200 XP
 * crus, 400 ajustados (x2, médio); com os 2 lobos da rodada 2, 300 crus e 600
 * ajustados — difícil.
 *
 * MEDIDO com o motor real, surpresa incluída, 1.000 combates: 100% de
 * vitória em 4,8 rodadas, 77% dos PV sobrando, alguém vai ao chão em 60% dos
 * combates, duas quedas ou mais em 31%, nenhuma morte. Sem a surpresa: 53% e
 * 24%. A surpresa pesa pouco porque, pela regra, basta notar UM goblin para
 * não ser surpreendido — com quatro escondidos, o mais desajeitado entrega o
 * resto (ver `rolarSurpresa`).
 */
/**
 * OS QUATRO GOBLINS DA EMBOSCADA, dois de cada lado da trilha.
 *
 * ORÇAMENTO, medido: 4 goblins valem 200 XP, que com o multiplicador de
 * quatro inimigos dão 400 ajustados. Para quatro personagens de 1º NÍVEL o
 * limiar de mortal do DMG é exatamente 400 — ou seja, este é o combate mais
 * duro que a tabela permite, de propósito, porque é uma emboscada e o livro
 * a escreve assim. Simulado com o motor: o grupo ganha em 88% quando é
 * surpreendido e em 98% quando não é, e morre alguém em 6 a 8% das vezes.
 */
function foesEmboscada() {
  // QUATRO GOBLINS, DOIS DE CADA LADO DA ESTRADA — o livro, na Mina e no Obelisco. Até 2026-11-08 eram três e dois
  // lobos na rodada 2 (decisão nossa, medida abaixo); o dono mandou aplicar o livro, e voltou a ser o livro.
  //
  // A MEDIDA DA DECISÃO ANTIGA, NO MAPA DE HOJE, 400 lutas por coluna, as mesmas sementes, com `--livro` trocando o bando pelos
  // quatro goblins do livro e tirando os lobos (`node --import ./src/dev/cena-node/register.mjs
  // src/dev/simular-emboscada.mjs 400 [--livro]`):
  //
  //                        nosso (3 goblins + 2 lobos)    livro (4 goblins)
  //    vitórias do grupo              97%                       99%
  //    alguma morte                    0%                        1%
  //    alguém a 0 PV                  28%                       14%
  //    duas quedas ou mais            11%                        7%
  //    rodadas                        3,1                       2,6
  //    vida que sobra                 78%                       86%
  //
  // A nossa desgastava mais e matava menos. O livro é mais curto e mais limpo, com 1% de morte.
  const arco = { arma: 'Arco curto' };
  // Na moita (`%`), dos dois lados da estrada e entre o grupo e os cavalos mortos: é onde o livro os põe.
  const norte = [
    makeMonster('goblin', { x: 15, y: 6 }, { nameSuffix: 'A', tatica: 'atirador', ...arco }),
    makeMonster('goblin', { x: 18, y: 6 }, { nameSuffix: 'B', ...arco }),
  ];
  const sul = [
    makeMonster('goblin', { x: 16, y: 11 }, { nameSuffix: 'C', tatica: 'atirador', ...arco }),
    makeMonster('goblin', { x: 19, y: 11 }, { nameSuffix: 'D', ...arco }),
  ];
  // Cada lado olha para a estrada.
  for (const f of norte) f.facingVec = { dx: 0, dy: 1 };
  for (const f of sul) f.facingVec = { dx: 0, dy: -1 };
  return [...norte, ...sul];
}

export const REINFORCEMENTS = [
  {
    round: 3,
    aviso: 'Mais goblins vêm pela trilha!',
    spawn: [
      { id: 'goblin', at: { x: 14, y: 8 }, nameSuffix: 'C' },
      { id: 'goblin', at: { x: 14, y: 9 }, nameSuffix: 'D' },
    ],
  },
];

/**
 * Na emboscada os reforços saem da moita do sul — e são LOBOS.
 *
 * Dois goblins a mais repetiam o que já está em cena: mais dois arqueiros.
 * Dois lobos (SRD, ND 1/4, 50 XP cada: o mesmo orçamento) correm 40 pés,
 * derrubam com a mordida e prendem o grupo na estrada enquanto os arqueiros
 * atiram. Medido: com lobos, duas quedas ou mais em 44% dos combates; com
 * goblins, 27%.
 *
 * RODADA 2, E DENTRO DO ALCANCE. No mapa antigo nasciam na boca da trilha, a
 * quinze casas, e chegavam com o combate decidido; aqui saem do espinheiro do
 * sul a cinco e oito casas, o bastante para fechar em um turno de corrida sem
 * já começarem mordendo. Medido em `src/dev/simular-emboscada.mjs`, 400 lutas:
 * 97% de vitória, nenhuma morte, alguém a 0 PV em 28% e dois ou mais em 11%,
 * em 3,1 rodadas e com 78% dos PV do grupo de pé. Saíam de três casas: 6% de
 * derrota. No mapa antigo, que era mais largo: 7% e 4%.
 */
// A emboscada do livro não tem reforço (os lobos da rodada 2 eram nossos, e saíram com o Obelisco).
const REFORCOS_EMBOSCADA = [];

/** Monta os reforços de uma rodada, ou null se não houver. */
export function reinforcementsFor(round, variante = 'arena') {
  if (['esconderijo', 'rua', 'mansao', 'mansaoTunel', 'ermo', 'ermoNoite', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco', 'editor', 'covilAgatha', 'cavernaDoPoco', 'acampamentoSawplee', 'telhadoGigante', 'giganteTerreo', 'zorzulaPosto', 'zorzulaMinas', 'santuarioIndigo', 'casaMarthungrim', 'minaHardyhammer', 'largoDaVaca', 'santuarioInfectado', 'tunelGrells', 'tunelBehir', 'tunelGruta', 'illithinoch', 'fendaTrincheiras', 'fendaOco', 'fendaLabirinto', 'labirintoSalgado', 'covilLowarnizel', 'pocaSalgada', 'vazioCupula', 'vazioPonte', 'vazioCharco', 'vazioNematodeo', 'vazioMiasma', 'vazioEstatua', 'vazioCampo', 'vazioAnima', 'talhundereth', 'criptaTalhund', 'encruzilhada', 'grandes', 'casaDaMorte1', 'casaDaMorte2', 'casaDaMorte3', 'casaDaMorte4', 'casaDaMortePorao1', 'casaDaMortePorao2'].includes(variante)) return null;
  const ondas = variante === 'emboscada' ? REFORCOS_EMBOSCADA : REINFORCEMENTS;
  const wave = ondas.find((w) => w.round === round);
  if (!wave) return null;
  const units = wave.spawn.map((s) => {
    const m = makeMonster(s.id, s.at, { nameSuffix: s.nameSuffix });
    m.facingVec = { ...(wave.olhar ?? { dx: -1, dy: 1 }) };
    return m;
  });
  return { aviso: wave.aviso, units };
}
