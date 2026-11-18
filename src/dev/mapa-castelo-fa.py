"""O CASTELO CRAGMAW sobre o battlemap da Forgotten Adventures (31x22).

    python src/dev/importar-foundry.py mapas/_cenas/cragmaw-castle-31x22.json <imagem> --editor src/dev/_tmp/castelo-fa.json
    python src/dev/mapa-castelo-fa.py

Escreve `src/game/castelo.js`. Mesmo caminho do Poço e do Cume: a planta vem do Foundry (parede, porta, luz,
sobreposição), o terreno vem da COR do desenho, e cada ponto que o capítulo usa é MEDIDO no motor antes de o
arquivo sair. Se um ponto cair em parede, ou uma sala vier vazia, o gerador se recusa a escrever.

POR QUE REFAZER A PLANTA, e não só pôr a imagem por baixo (como se fez na Mansão): `prova-fundo.py` mostra a
nossa parede correndo POR FORA da parede pintada. É o mesmo castelo em planta diferente — a nossa é 39x28 e a
deles 31x22. A nota de encaixe dava 0,973 ("a mesma planta") e estava inflada: 97% do desenho conta como
interior, então a conta não separava nada. Quem decidiu foi a figura.

O DESENHO É QUASE PRETO (luminância mediana 48 de 255): é a base SEM luz, feita para as 34 luzes da cena
acenderem. É o mesmo modelo da Mansão e da Onda Eco — a sala nasce no breu e quem acende é a chama.

AS SALAS SÃO SEMENTE + CAIXA, e não retângulo. Inundar livre não serve: as arcadas do castelo ligam quase tudo
(medido: 378 das 503 casas num pedaço só, com as portas fechadas). Então cada sala é uma SEMENTE, inundada
dentro de uma CAIXA. O que a semente alcança é a sala; quem reclamar primeiro fica com a casa, e o gerador diz
quantas casas cada uma pegou. Os nomes vieram do de-para com a planta antiga, canto por canto, e dos ladrilhos
que a própria FA nomeia (`shrine`, `trap`, `table1/2`, `bedwreck`): esses seis são certos, os outros são leitura
do desenho e estão marcados com `?` no relatório — é o que há para corrigir olhando a figura.
"""
import json
import os
import pathlib
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENTRADA = os.path.join(RAIZ, 'src', 'dev', '_tmp', 'castelo-fa.json')
SAIDA = os.path.join(RAIZ, 'src', 'game', 'castelo.js')
IMAGEM = os.path.join(RAIZ, 'mapas', 'CragmawCastle', 'FA_Battlemaps', 'Cragmaw_Castle_31x22', 'WebP',
                      'CragmawCastle_Gridless_31x22_200ppi.webp')
# A MESMA IMAGEM SEM MOBÍLIA. A Forgotten Adventures publica as duas, e a DIFERENÇA entre elas é a mobília
# desenhada, casa a casa — o mesmo truque que separou telhado e copa na Árvore Trovão. Sem isto, a mobília do
# Castelo era posta por um algoritmo que espalhava as peças pelas casas livres, sem saber do desenho: medido,
# só 37 das 105 casas de móvel nosso caíam onde a FA desenha alguma coisa, 68 barravam o passo em cima de
# chão vazio, e 24 mesas pintadas eram atravessáveis.
SEM_MOBILIA = os.path.join(RAIZ, 'mapas', 'CragmawCastle', 'FA_Battlemaps', 'Cragmaw_Castle_31x22', 'WebP',
                           'CragmawCastleUnfurnished_Gridless_31x22_200ppi.webp')


def casas_com_movel(w, h, limiar=0.15):
    """As casas em que a FA DESENHA mobília, da mais cheia para a mais vazia."""
    import numpy as np
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    ler = lambda f: np.asarray(Image.open(f).convert('RGB').resize((w * 100, h * 100), Image.LANCZOS), dtype=np.int16)
    dif = np.abs(ler(IMAGEM) - ler(SEM_MOBILIA)).mean(axis=2) > 16
    por = dif.reshape(h, 100, w, 100).mean(axis=(1, 3))
    casas = [(float(por[y][x]), x, y) for y in range(h) for x in range(w) if por[y][x] >= limiar]
    casas.sort(key=lambda q: (-q[0], q[1], q[2]))
    return [(x, y) for _v, x, y in casas]

# nome -> (semente, caixa x0, y0, x1, y1, certeza). `certeza` False = leitura do desenho, a conferir.
SALAS = [
    # as seis que os ladrilhos da FA nomeiam
    # As caixas do santuário, da ruína e da guarda param NA CORTINA. Com as quatro cortinas viradas em aresta
    # etérea o passo passa por elas, e uma caixa folgada fazia a sala de cima engolir a de baixo: o santuário
    # ia buscar a capela pelos dois arcos, a ruína descia para a passagem e a guarda subia para o corredor
    # nordeste. A caixa é o que diz onde a sala acaba quando a aresta não diz.
    ('santuario',      (13, 5), (11, 2, 16, 6), True),    # ladrilho `shrine` em (13,4)
    ('salaoArmadilha', (9, 11), (6, 9, 12, 13), True),    # ladrilho `trap` em (9,10)
    ('banquete',      (13, 14), (10, 12, 17, 17), True),  # ladrilhos `table1`/`table2`
    ('rei',            (26, 6), (23, 2, 30, 11), True),   # ladrilho `bedwreck` em (25,7)
    ('alojamentoHob',   (6, 6), (3, 3, 10, 10), True),    # a torre redonda do noroeste, com os beliches
    ('torreUrso',     (21, 18), (18, 15, 24, 21), True),  # a torre redonda do sudeste
    # O SALÃO ESCURO (8) SAIU DA PASSAGEM E FOI PARA A CAPELA, e é o ladrilho da FA que diz onde. Até
    # 2026-11-06 `salaoEscuro` era a caixa (16,9)-(21,15) — que, medido, tem QUATRO portas (ruína, capela,
    # guarda, corredor) e é a passagem central do castelo, a que o livro não numera. O grick, o braseiro com a
    # estatueta e os entalhes angelicais moravam nela.
    #
    # A área 8 do livro é "um salão alto e estreito... parte de uma capela ou templo", e ao NORTE dela "grossas
    # cortinas tapam a passagem por um par de arcos", com o santuário (9) do outro lado. Inundando de (13,9) na
    # caixa abaixo, o motor devolve 18 casas: (12,7), (15,7) e o bloco x12..15, y8..11. As duas primeiras são
    # os DOIS ARCOS, cada um com a sua porta para o santuário — (12,6)|(12,7) e (15,6)|(15,7) —, com parede
    # entre eles em (13,7) e (14,7). E o ladrilho `Shrine.webp` 5x5 da FA cobre (12,7)-(16,11), com o
    # `ChapelTreasure.webp` em (13,8), entre os arcos: é o braseiro de pedra com a estatueta, onde o livro o põe.
    ('salaoEscuro',    (13, 9), (11, 7, 16, 11), True),
    # leitura do desenho — a conferir
    ('torreSul',       (6, 17), (3, 13, 10, 20), True),   # area 4: a torre do sudoeste, 3 goblins e 150 XP
    ('ruina',          (19, 6), (16, 2, 23, 8), True),    # area 11: o ladrilho `Canvas.webp` da lona cai nela
    ('passagem',      (19, 11), (16, 9, 21, 15), True),   # a passagem central, que o livro NAO numera (4 portas)
    ('guarda',        (22, 12), (20, 10, 25, 16), True),  # area 12: o ladrilho `Barracks.webp` 4x6 cai nela
    # a faixa de x15..18, y16..19 que eu tinha chamado de corredor é ESPESSURA DE PAREDE: o motor não alcança
    # casa nenhuma ali (são as alcovas das seteiras do desenho). O corredor é a passagem a leste do banquete.
    ('corredor',      (17, 16), (16, 14, 19, 19), True),  # a passagem logo dentro do portao traseiro (area 10)
    # OS POSTOS DE ARQUEIRO (3) SÃO OS DOIS BOLSOS QUE FLANQUEIAM A ENTRADA. Eram (9,16)-(13,20), no capim de
    # fora, e (11,9)-(16,11), que é metade da capela — de modo que os quatro goblins da área 3 nasciam um par
    # dentro da área 8 e o outro par ao lado do portão traseiro, que o livro chama de "trancada, mas não é
    # vigiada". Listando os bolsos de chão sem sala do castelo, só dois são pequenos, cheios de entulho e
    # colados no salão da armadilha (a área 2, logo dentro dos portões): (5,8)-(7,9), com 5 casas, e
    # (6,14)-(7,15), com 4. É a área 3 do livro, "esta pequena sala está cheia com detritos", duas delas.
    #
    # O CAMPO DE TIRO PARA O TERRAÇO NÃO EXISTE NESTA PLANTA, e isso é medida, não desleixo: das 43 seteiras do
    # mapa da FA, ZERO têm um lado no terraço, e desses dois bolsos vê-se 0 e 2 das 48 casas dele. O livro dá
    # aos postos "um bom campo de tiro para o terraço em frente aos portões"; a planta da FA põe cada seteira
    # na espessura da parede, com rocha do outro lado. O que fica é o resto da área 3, que é o que o livro faz
    # acontecer de verdade: "quando os personagens entrarem na sala, os goblins largam seus arcos curtos".
    ('postoNorte',      (6, 8), (4, 7, 7, 10), True),     # area 3 norte: bolso de entulho ao lado da area 2
    ('postoSul',       (6, 14), (5, 13, 7, 16), True),    # area 3 sul: o outro bolso, do outro lado
    ('despensa',       (10, 5), (9, 3, 11, 9), True),     # area 5: e dela que sai o equipamento do Sildar
    # A SALA NOROESTE: o banheiro da área 14. São 5 casas que só se alcançam atravessando o quarto do rei
    # (medido: dos bolsos sem sala do castelo, é o único cujo vizinho é só `rei`), e o livro a descreve debaixo
    # da própria área 14 — "esta parcialmente derrubada câmara foi uma vez um confortável banheiro. Ela ainda
    # contém uma larga banheira de azulejo". Era chão anônimo, e a banheira estava solta no quarto do rei.
    ('banheiro',       (23, 5), (22, 4, 23, 6), True),
    ('terraco',        (2, 11), (0, 8, 5, 16), True),     # area 1: o patio diante dos portoes quebrados
]


# Quantos moradores cada bando põe na sala dele. O capítulo deixou de cravar casa: ele lê daqui.
# Medido na planta velha e trazido para esta: 13 das 30 posições cravadas no capítulo caíam na sala ERRADA
# depois da troca de planta, e 8 delas em pedra — os arqueiros do posto norte nasciam dentro do alojamento dos
# hobgoblins, os do sul no mato, e o grick dentro de uma parede.
POSTOS = {
    'postoNorte': ('postoNorte', 2),
    'postoSul': ('postoSul', 2),
    'torreSul': ('torreSul', 3),
    'hobgoblins': ('alojamentoHob', 2),
    'hobgoblins2': ('alojamentoHob', 2),
    'banquete': ('banquete', 4),
    'cozinha': ('banquete', 4),
    'santuario': ('santuario', 3),
    'guarda': ('guarda', 2),
    'grick': ('salaoEscuro', 1),
    'urso': ('torreUrso', 1),
    'rei': ('rei', 4),
}


# A MOBÍLIA DE CADA SALA, trazida da planta antiga, que foi desenhada do mapa do livro. Os números saíram de
# contar os glifos de `castelo.js` antes da troca de planta, sala por sala: o alojamento tinha 11 de palha e 5
# de entulho, a torre do urso 7 de ossos, o banquete 3 mesas, e assim por diante. A CASA exata não transfere
# (a planta é outra), mas a IDENTIDADE sim — o livro diz o que há em cada área, e o desenho da FA concorda.
#
# Isto não é enfeite: cada glifo é uma superfície, e superfície é o que o botão direito tem para Olhar e
# Investigar (`game/investigar.js ACHADOS_DA_SUPERFICIE`). Sem ela o castelo inteiro respondia "Laje" — medido:
# 1 superfície, 0 peças de mobília, e 88 de 572 casas com alguma opção, quase todas portas.
#
# Os que BARRAM passo (caixotes, mesa, arca, armeiro, cama do rei, banheira, desabamento, braseiro, altar,
# portão caído, mesa de banquete) entram por último e só onde não fecham a sala: as provas conferem no motor.
MOBILIA = {
    # o livro é exato aqui: "quatro pilhas de palha e colchonetes estão alinhados pelo chão deste
    # alojamento. Suportes na parede mantêm várias armas... o CHÃO É LIMPO DE ENTULHO". A receita antiga
    # vinha da planta antiga e tinha 23 peças para 4 casas úteis, 5 delas de entulho.
    'alojamentoHob': 'pppp g',
    # a BANHEIRA saiu do quarto do rei e foi para a Sala Noroeste, que é onde o livro a põe. Ela estava em
    # (25,8) e (26,7), no meio do quarto, porque não havia sala para onde ir.
    'rei':           'xxxxxx DDDD vvv mm i E e t',
    'banheiro':      'B x j',
    # "velhos barris com carne salgada e sacos de grãos apodrecendo PREENCHEM esta área de depósito"
    'despensa':      'iii x d',
    'santuario':     'xx aa v',
    # "caixas velhas e antigos barris mostram que uma vez as provisões eram estocadas aqui"; e a torre
    # "está quase completamente desmoronada" — dois montes, que é o que o desenho mostra
    'ruina':         'EEE EE ii jj x d',
    # a capela (8), com o braseiro frio entre os arcos; e a passagem central, que não tem braseiro nenhum
    'salaoEscuro':   'xxxxxx jjj vv EE f',
    'passagem':      'xxxx vv jj E',
    # os dois postos de arqueiro: "esta pequena sala está cheia com detritos", e nada mais. São 5 e 4 casas, e
    # os dois goblins de cada um já ficam reservados, então a receita é do tamanho do que sobra.
    'postoNorte':    'xx',
    'salaoArmadilha': 'xxxxxxxx ddd',
    # "duas folhas podres, com ferragens verdes de azinhavre, UMA DELAS CAIDA" diz a chegada ao terraco
    # (`capitulo4-castelo.js`), e nao havia um `portaoCaido` no mapa inteiro: a FA pinta os portoes como
    # parte da arte da muralha, nao como movel solto, entao a peca nunca achava casa pintada. Virou
    # exigida, e por isso aceita casa comum.
    'terraco':       'xx dd I E',
    # "um braseiro de pedra cheio de carvão brilha no meio deste pequeno alojamento. QUATRO pilhas de palha
    # estão alinhadas ao longo do muro ao leste"
    'guarda':        'pppp e x d',
    'postoSul':      'x',
    # "DUAS largas mesas de madeira com bancos lisos ficam no meio da sala, e um braseiro de cobre cheio de
    # carvões quentes está colocado em um canto. A porção OESTE deste largo salão é uma parede de escombros."
    # Duas palavras de `N` = duas mesas; uma palavra só saía como uma mesa de seis casas.
    'banquete':      'xxx NNN NNN EEE e d v c',
    'corredor':      'x',
    # "a torre sul é pouco mais do que uma pilha de destroços. Vários SACOS DE DORMIR esfarrapados estão
    # espalhados pelo que sobrou de espaço no chão" — faltava a palha, e sobrava receita da planta antiga
    'torreSul':      'ppp xx EE',
    # "poeira, escombros e vidro quebrado estão espalhados pelo chão, uma velha MESA DE TRABALHO e estantes
    # de livros ficam ao sul"
    'torreUrso':     'ddd EEE m cc t x',
}
BARRA = set('imtgDBEefaIN')      # os glifos que fecham o passo (`core/grid.js GLIFOS`, kind 3)

# O QUE O ROTEIRO EXIGE, por sala. `capitulo4-castelo.js` tem interações presas À SUPERFÍCIE: o armeiro dos
# hobgoblins só dá as armas se houver um armeiro, o braseiro do salão escuro só se acende se houver braseiro.
# Medido depois de a mobília passar a só entrar onde a FA a desenha: `armeiro` e `braseiroFrio` sumiram do
# mapa — a receita os tinha no fim da lista e eles eram os primeiros a sobrar —, e com eles dois trechos
# inteiros do capítulo ficaram sem gatilho. Estas peças entram ANTES de todas, e se não couberem o gerador
# se recusa a escrever.
SUP_DO_GLIFO = {'g': 'armeiro', 'f': 'braseiroFrio', 'a': 'altar', 't': 'arca', 'D': 'camaRei', 'i': 'caixotes',
                'B': 'banheira', 'I': 'portaoCaido'}
EXIGIDAS = {
    'g': 'alojamentoHob',    # o armeiro dos hobgoblins
    'f': 'salaoEscuro',      # o braseiro frio, entre os dois arcos da capela
    'a': 'santuario',        # o altar
    't': 'torreUrso',        # a arca do urso
    'D': 'rei',              # a cama do rei
    'i': 'despensa',         # os caixotes da despensa
    'I': 'terraco',          # a folha de portao caida diante dos portoes
    'B': 'banheiro',         # a banheira de azulejo da Sala Noroeste
}
EXIGE_SUP = {g: {'sala': sala, 'nome': SUP_DO_GLIFO[g]} for g, sala in EXIGIDAS.items()}


def motor(programa, extra=None):
    base = pathlib.Path(RAIZ).as_uri()
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module',
                        '-e', programa.replace('@BASE@', base)],
                       cwd=RAIZ, capture_output=True, text=True, env={**os.environ, **(extra or {})})
    if r.returncode:
        sys.exit(f'o motor recusou:\n{r.stderr.strip()}')
    return json.loads(r.stdout.strip().splitlines()[-1])



def alcance_com_portas_abertas(mapa):
    """As casas que o grupo alcanca com TODA porta aberta. O resto e espessura de parede, e vira rocha."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
  if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
}
const alc = f.reachable(JSON.parse(process.env.GRUPO)[0], 100000);
console.log(JSON.stringify([...(alc.keys ? alc.keys() : alc)]));
'''
    return set(motor(programa, {'MAPA': json.dumps(mapa), 'GRUPO': json.dumps(mapa['grupo'])}))



def espalhar(casas, quantas):
    """`quantas` casas da sala, as mais espalhadas possível: comeca no meio e vai pegando a mais longe."""
    if not casas:
        return []
    cx = sum(c['x'] for c in casas) / len(casas)
    cy = sum(c['y'] for c in casas) / len(casas)
    escolhidas = [min(casas, key=lambda c: (c['x'] - cx) ** 2 + (c['y'] - cy) ** 2)]
    while len(escolhidas) < min(quantas, len(casas)):
        def longe(c):
            return min((c['x'] - e['x']) ** 2 + (c['y'] - e['y']) ** 2 for e in escolhidas)
        escolhidas.append(max((c for c in casas if c not in escolhidas), key=longe))
    return escolhidas


def inundar(mapa):
    """Cada sala, inundada da semente dentro da caixa dela, pelo motor. Devolve nome -> lista de casas."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const salas = JSON.parse(process.env.SALAS);
const dono = new Map();
const saida = {};
for (const [nome, [sx, sy], [x0, y0, x1, y1]] of salas) {
  const casas = [];
  if (f.inside(sx, sy) && !f.blocksMove(sx, sy) && !dono.has(`${sx},${sy}`)) {
    const vistos = new Set([`${sx},${sy}`]);
    const fila = [[sx, sy]];
    while (fila.length) {
      const [x, y] = fila.pop();
      if (dono.has(`${x},${y}`)) continue;           // outra sala chegou primeiro
      dono.set(`${x},${y}`, nome);
      casas.push({ x, y });
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue;
        if (!f.inside(nx, ny) || f.blocksMove(nx, ny) || vistos.has(`${nx},${ny}`)) continue;
        if (!f.passa(x, y, nx, ny, 'passo')) continue;
        vistos.add(`${nx},${ny}`); fila.push([nx, ny]);
      }
    }
  }
  saida[nome] = casas;
}
console.log(JSON.stringify(saida));
'''
    return motor(programa, {'MAPA': json.dumps(mapa),
                            'SALAS': json.dumps([[n, list(s), list(c)] for n, s, c, _ in SALAS])})


def portas(mapa):
    """Toda aresta de PORTA do mapa, com as duas casas — para escolher as nomeadas por posição."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const out = [];
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) out.push([{ x, y: y - 1 }, { x, y }]);
  if (f.paredeO[i] === ARESTA.porta) out.push([{ x: x - 1, y }, { x, y }]);
}
console.log(JSON.stringify(out));
'''
    return motor(programa, {'MAPA': json.dumps(mapa)})



def mobiliar(mapa, celulas, reservado, receitas, pintadas=(), ancoras=None):
    """Põe a mobília NO MOTOR, peça a peça: a que barra passo só entra se a sala continuar inteira depois dela.

    Tentar adivinhar onde cabe não funciona — nem "no meio" nem "na beirada". A beirada de uma sala é onde fica
    o gargalo que a liga ao resto, e medido assim a torre do urso ficou sem entrada e o quarto do rei perdeu
    três casas. Quem sabe se a sala continua inteira é o motor, então é ele que decide, peça por peça.
    """
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const GRID = await import('@BASE@/src/core/grid.js');
const { GLIFOS } = GRID;
const mapa = JSON.parse(process.env.MAPA);
const celulas = JSON.parse(process.env.CELULAS);
const reservado = new Set(JSON.parse(process.env.RESERVADO));
// A ORDEM DAS CASAS: primeiro as que a FA DESENHA com móvel. É o desenho que diz ONDE, e a receita
// da sala que diz O QUÊ — a imagem não distingue uma cama de uma mesa, e isso é saber nosso.
const pintadas = new Set(JSON.parse(process.env.PINTADAS));
const exigidas = JSON.parse(process.env.EXIGIDAS);
const ancoras = JSON.parse(process.env.ANCORAS ?? '{}');
const ordem = (cs) => [...cs].sort((a, b) => Number(pintadas.has(`${b.x},${b.y}`)) - Number(pintadas.has(`${a.x},${a.y}`)));
const receitas = JSON.parse(process.env.RECEITAS);
const t = mapa.terreno.map((l) => [...l]);
const monta = () => montarCampo({ ...mapa, terreno: t.map((l) => l.join('')) });
const barra = (g) => GLIFOS[g]?.kind === 3;

/** Toda casa livre da sala se alcança de qualquer outra, e a sala se alcança do grupo? */
function inteira(f, cs) {
  const livres = cs.filter((c) => !f.blocksMove(c.x, c.y));
  if (!livres.length) return false;
  const chave = (c) => `${c.x},${c.y}`;
  const dentro = new Set(livres.map(chave));
  const vistos = new Set([chave(livres[0])]);
  const fila = [livres[0]];
  while (fila.length) {
    const p = fila.pop();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (!dentro.has(chave(q)) || vistos.has(chave(q))) continue;
      if (f.blocksMove(q.x, q.y) || !f.passa(p.x, p.y, q.x, q.y, 'passo')) continue;
      vistos.add(chave(q)); fila.push(q);
    }
  }
  if (vistos.size !== livres.length) return false;
  // ... e o GRUPO ainda tem de chegar nela: um movel na unica porta fecha a sala sem a partir por dentro
  const { ARESTA } = GRID;
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
    if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
  }
  const alc = f.reachable(mapa.grupo[0], 100000);
  return livres.every((c) => alc.has(chave(c)));
}

const postas = {};
const sobraram = {};
for (const [sala, receita] of Object.entries(receitas)) {
  const cs = ordem((celulas[sala] ?? []).filter((c) => !reservado.has(`${c.x},${c.y}`)));
  if (!cs.length) continue;
  const glifos = [...receita].filter((g) => g !== ' ');
  // CADA PALAVRA DA RECEITA É UMA PEÇA. `'xxx NNN NNN EEE'` são três casas de entulho, DUAS mesas de três
  // casas cada e um desabamento de três — e não nove móveis soltos. É assim que o livro fala do banquete
  // ("duas largas mesas de madeira") e do quarto do rei ("uma grande cama").
  const pecas = [];
  receita.split(' ').filter(Boolean).forEach((palavra, i) => {
    for (const g of palavra) if (barra(g)) pecas.push({ g, peca: i });
  });
  let n = 0;
  const ocupadas = new Set();

  // O MÓVEL ENTRA PRIMEIRO, e só onde a FA o desenha. Ele é o que o jogador VÊ — mesa, arca, cama, braseiro —,
  // e espalhá-lo pelas casas livres punha barreira invisível sobre chão vazio (medido: 68 das 105 casas) e
  // deixava atravessável a mesa pintada (24 casas). A pintura diz ONDE; a receita da sala diz O QUÊ, porque a
  // imagem não distingue uma cama de uma mesa e isso é saber nosso.
  //
  // E ele entra ANTES da textura de chão: a palha e os cacos eram postos primeiro, espalhados por toda a
  // sala, e cobriam justamente as casas pintadas — o quarto do rei tinha 13 casas de móvel desenhado e
  // nenhuma sobrava para as 12 peças dele.
  //
  // E HÁ UM TETO: metade da sala fica livre. É a mesma conta que `provas` cobra ("móvel demais"), e ela
  // existe porque a FA pinta com generosidade — a torre sul tem 6 das 9 casas com móvel desenhado, e pôr as
  // seis fecharia o cômodo. Quando bate no teto, o resto da receita sai no relatório em vez de entrar calado.
  const teto = Math.floor((celulas[sala] ?? []).length / 2);
  // A PEÇA QUE O ROTEIRO EXIGE ENTRA PRIMEIRO, e se não houver casa pintada para ela aceita uma casa comum:
  // é melhor um armeiro que o desenho não mostra do que um trecho do capítulo sem gatilho nenhum.
  const exigeAqui = Object.entries(exigidas).filter(([, s2]) => s2 === sala).map(([g]) => g);
  // a ordenação é ESTÁVEL em JS, então as casas de uma mesma peça continuam juntas depois dela
  const ordenados = [...pecas].sort((a, b) =>
    Number(exigeAqui.includes(b.g)) - Number(exigeAqui.includes(a.g)));
  // MÓVEL DE VÁRIAS CASAS SAI INTEIRO, e não em pedaços espalhados pela sala.
  //
  // A receita diz quantas casas cada peça tem — `DDDD` é uma cama grande, `NNN` a mesa comprida do banquete,
  // `mm` uma mesa de duas casas —, mas cada cópia era posta por conta própria, na primeira casa pintada que
  // coubesse. Medido no quarto do rei: a cama saía em (25,4), (26,6), (25,7) e (26,9), QUATRO camas de uma
  // casa nos quatro cantos, e as duas `mm` viravam duas mesas em metades opostas. O livro tem "uma grande
  // cama ao norte" e "uma mesa redonda ao sul, perto da porta" — uma de cada.
  //
  // Agora cada cópia depois da primeira procura ANTES as casas que encostam no que já se pôs do mesmo glifo.
  // É preferência e não exigência: se nenhuma vizinha servir (a sala ficaria partida, ou o desenho não pinta
  // móvel ali), ela ainda entra solta, porque perder a peça é pior — e `provas` conta quantas ficaram assim.
  const postasDo = new Map();          // peça -> casas dela
  const doGlifo = new Map();           // glifo -> casas de TODAS as peças dele
  const encosta = (a, b) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
  const perto = ({ g, peca }, lista) => {
    const minhas = postasDo.get(peca) ?? [];
    if (minhas.length) {                               // continuar a MESMA peça: cola nela
      const vizinhas = lista.filter((q) => minhas.some((p) => encosta(p, q)));
      return [...vizinhas, ...lista.filter((q) => !vizinhas.includes(q))];
    }
    // começar uma peça nova: FOGE das outras peças do mesmo glifo, senão as duas mesas do banquete
    // viram uma mesa só de seis casas
    const outras = (doGlifo.get(g) ?? []);
    if (!outras.length) return lista;
    const longe = lista.filter((q) => !outras.some((p) => encosta(p, q)));
    return [...longe, ...lista.filter((q) => !longe.includes(q))];
  };
  let faltou = 0;
  let partidas = 0;
  for (const { g, peca } of ordenados) {
    if (ocupadas.size >= teto && !exigeAqui.includes(g)) { faltou += 1; continue; }
    let posta = false;
    // A peça exigida que não tem casa PINTADA onde cair (a folha de portão do terraço: a FA desenha os
    // portões na arte da muralha, não como móvel solto) ia parar na primeira casa que servisse, e isso deu
    // (0,13) — a beira oeste do terraço, a dez casas dos portões que a narração descreve. Com âncora, ela
    // procura a partir da casa que o livro indica.
    const ancora = ancoras[g];
    const porAncora = (lista) => (ancora
      ? [...lista].sort((p, q) => (Math.hypot(p.x - ancora.x, p.y - ancora.y)
        - Math.hypot(q.x - ancora.x, q.y - ancora.y)))
      : lista);
    const alvo = perto({ g, peca }, exigeAqui.includes(g)
      ? [...porAncora(cs.filter((q) => pintadas.has(`${q.x},${q.y}`))),
        ...porAncora(cs.filter((q) => !pintadas.has(`${q.x},${q.y}`)))]
      : cs.filter((q) => pintadas.has(`${q.x},${q.y}`)));
    for (const c of alvo) {
      if (ocupadas.has(`${c.x},${c.y}`)) continue;
      const antes = t[c.y][c.x];
      t[c.y][c.x] = g;
      const f = monta();
      if (inteira(f, celulas[sala])) {
        ocupadas.add(`${c.x},${c.y}`);
        const minhas = postasDo.get(peca) ?? [];
        if (minhas.length && !minhas.some((p) => encosta(p, c))) partidas += 1;
        postasDo.set(peca, [...minhas, c]);
        doGlifo.set(g, [...(doGlifo.get(g) ?? []), c]);
        n += 1; posta = true; break;
      }
      t[c.y][c.x] = antes;
    }
    if (!posta) faltou += 1;
  }

  // a textura de chão — palha, cacos, ossos, musgo, mancha, entulho — espalha-se pelo que sobrou
  const livres = glifos.filter((g) => !barra(g));
  const sobra = cs.filter((c) => !ocupadas.has(`${c.x},${c.y}`));
  let baixas = 0;
  for (let i = 0; i < livres.length && i < sobra.length; i += 1) {
    const c = sobra[Math.floor((i * sobra.length) / Math.max(livres.length, 1))];
    if (ocupadas.has(`${c.x},${c.y}`)) continue;
    t[c.y][c.x] = livres[i]; ocupadas.add(`${c.x},${c.y}`); n += 1; baixas += 1;
  }
  const demais = { livres: livres.length - baixas, casas: cs.length, receita: glifos.length };
  postas[sala] = n;
  if (faltou || demais.livres || partidas) {
    sobraram[sala] = { barram: faltou, baixas: demais.livres, casas: demais.casas,
      receita: demais.receita, partidas };
  }
}
console.log(JSON.stringify({ terreno: t.map((l) => l.join('')), postas, sobraram }));
'''
    return motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas),
                            'RESERVADO': json.dumps(sorted(reservado)), 'RECEITAS': json.dumps(receitas),
                            'PINTADAS': json.dumps([f'{x},{y}' for x, y in pintadas]),
                            'EXIGIDAS': json.dumps(EXIGIDAS),
                            'ANCORAS': json.dumps(ancoras or {})})


def arestas_de_porta(mapa):
    """Toda aresta de PORTA da planta, como par de casas — o que vira `folhas`.

    `folhas` nao e enfeite: `capitulo.portasDaCasa` so oferece abrir/fechar numa aresta que esta nesta lista,
    e a cena declara `portasProprias: true`, entao `game/portas.js` tambem nao cuida delas. Sem a lista, NENHUMA
    porta da cena abre. A planta antiga trazia as portas na mao; a da FA as traz em `tracosTipo`, e aqui elas
    sao LIDAS DO CAMPO MONTADO, que e onde traco e parede ja viraram aresta.
    """
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const fora = [];
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) fora.push([{ x, y: y - 1 }, { x, y }]);
  if (f.paredeO[i] === ARESTA.porta) fora.push([{ x: x - 1, y }, { x, y }]);
}
console.log(JSON.stringify(fora));
'''
    return motor(programa, {'MAPA': json.dumps(mapa)})


def provas(mapa, celulas, pontos):
    """Cada ponto cai em chão, cada sala tem casa, e o grupo alcança todas elas. Falha alto se não."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const celulas = JSON.parse(process.env.CELULAS);
const pontos = JSON.parse(process.env.PONTOS);
const erros = [];
// A sala PODE ter casa bloqueada: e a mobilia (mesa, caixote, braseiro). O que nao pode e a sala ficar sem
// casa livre, ou com menos da metade dela livre — ai o movel fechou o comodo em vez de o mobiliar.
for (const [nome, cs] of Object.entries(celulas)) {
  if (!cs.length) { erros.push(`a sala ${nome} ficou vazia: a semente caiu em parede ou noutra sala`); continue; }
  const livres = cs.filter((c) => !f.blocksMove(c.x, c.y));
  if (!livres.length) erros.push(`a sala ${nome} ficou toda bloqueada pela mobilia`);
  else if (livres.length * 2 < cs.length) erros.push(`a sala ${nome} ficou com so ${livres.length} de ${cs.length} casas livres: movel demais`);
  // O MOVEL QUE O ROTEIRO EXIGE TEM DE ESTAR LA. `capitulo4-castelo.js` prende interacoes a superficie (o
  // armeiro dos hobgoblins, o braseiro do salao escuro, o altar, a arca, a cama, os caixotes): sem a peca, o
  // trecho fica sem gatilho e ninguem percebe. Ja aconteceu com o armeiro e com o braseiro frio.
  for (const [glifo, sup] of Object.entries(JSON.parse(process.env.EXIGE_SUP))) {
    if (sup.sala !== nome) continue;
    if (!cs.some((c) => f.surfaceAt(c.x, c.y) === sup.nome)) {
      erros.push(`a sala ${nome} ficou sem ${sup.nome} (glifo ${glifo}), que o roteiro usa`);
    }
  }
}
for (const [nome, p] of Object.entries(pontos)) {
  for (const q of [].concat(p)) {
    if (!f.inside(q.x, q.y)) { erros.push(`${nome} (${q.x},${q.y}) fica fora do mapa`); continue; }
    if (f.blocksMove(q.x, q.y)) erros.push(`${nome} (${q.x},${q.y}) caiu em casa bloqueada`);
  }
}
// com TODA porta aberta, o grupo tem de alcançar uma casa de cada sala
const { ARESTA } = await import('@BASE@/src/core/grid.js');
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
  if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
}
const grupo = JSON.parse(process.env.GRUPO)[0];
const alc = f.reachable(grupo, 100000);
for (const [nome, cs] of Object.entries(celulas)) {
  const livres = cs.filter((c) => !f.blocksMove(c.x, c.y));
  if (livres.length && !livres.some((c) => alc.has(`${c.x},${c.y}`))) erros.push(`o grupo nao alcanca a sala ${nome}`);
  const presas = livres.filter((c) => !alc.has(`${c.x},${c.y}`));
  if (presas.length) erros.push(`${nome}: ${presas.length} casa(s) livres que ninguem alcanca (${presas.slice(0, 4).map((c) => `${c.x},${c.y}`).join(' ')})`);
}
console.log(JSON.stringify(erros));
'''
    erros = motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas),
                             'PONTOS': json.dumps(pontos), 'GRUPO': json.dumps(mapa['grupo']),
                             'EXIGE_SUP': json.dumps(EXIGE_SUP)})
    if erros:
        sys.exit('A PLANTA NAO BATE:\n  - ' + '\n  - '.join(erros))


# AS CORTINAS DO LIVRO NÃO SÃO PORTAS. O Foundry da FA não tem aresta de cortina e marcou as quatro como
# porta, e porta aqui barra o passo até alguém abrir. O livro é explícito nas três áreas:
#
#   8  — "ao norte, grossas cortinas tapam a passagem por um par de arcos"
#   11 — "uma grossa cortina bloqueia a área ao sul"
#   12 — "uma cortina está pendurada no caminho em forma de arco ao norte"
#
# A aresta ETÉREA (`core/grid.js RESTRICOES[5]`) é a tradução exata: passo LIVRE, visão e luz BARRADAS, som
# livre. Atravessa-se sem abrir nada e não se vê o outro lado — que é o que uma cortina pesada faz, e é o que
# a cena precisa (os goblins do santuário "saem das cortinas do norte" sem ter porta para abrir).
#
# (lado, y, x) da aresta, e a área do livro de onde ela vem.
CORTINAS = [
    ('n', 7, 12, 'o arco oeste da area 8'),
    ('n', 7, 15, 'o arco leste da area 8'),
    ('n', 9, 18, 'a cortina ao sul da area 11'),
    ('n', 10, 23, 'o arco ao norte da area 12'),
]


def por_cortinas(paredes):
    """Troca as quatro portas que o livro chama de cortina por aresta etérea."""
    fora = []
    for lado, y, x, o in CORTINAS:
        linha = paredes[lado][y]
        if linha[x] != '+':
            fora.append(f'{o}: a aresta {lado}[{y}][{x}] e {linha[x]!r}, nao uma porta')
            continue
        paredes[lado][y] = linha[:x] + 'E' + linha[x + 1:]
    if fora:
        sys.exit('as cortinas nao batem com o mapa:\n  - ' + '\n  - '.join(fora))
    return paredes


# A SALA COM SETEIRA E SEM FOGO FICA EM PENUMBRA, e o livro é quem diz. A área 13 explica a regra pelo
# avesso: "as aberturas para arqueiro AQUI ESTÃO FECHADAS, deixando a sala escura" — se fechar as seteiras
# escurece a sala, é porque as abertas a clareiam. A área 8 é a outra exceção escrita: "mesmo de dia esta
# área não tem luz exterior".
#
# E a sala com FOGO DENTRO continua no breu, que é a lição já medida na Mansão e na Onda Eco: a sala que
# nasce clara faz a tocha dela não mudar casa nenhuma, e "Apagar a tocha" vira um botão sem consequência.
# `testes-cenas.mjs` guarda essa prova — nenhuma luz de mapa é inerte — e ela vale nas quatro cenas com luz.
SEM_LUZ_DO_DIA = {
    'salaoEscuro': 'area 8: "mesmo de dia esta area nao tem luz exterior"',
    'torreUrso': 'area 13: "as aberturas para arqueiro aqui estao fechadas, deixando a sala escura"',
}


def por_seteira(mapa, celulas):
    """Penumbra nas salas que têm seteira e não têm chama nenhuma dentro."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const mapa = JSON.parse(process.env.MAPA);
const celulas = JSON.parse(process.env.CELULAS);
const semDia = new Set(JSON.parse(process.env.SEM_DIA));
const f = montarCampo(mapa);
const luz = mapa.luz.map((l) => [...l]);
const saida = {};
for (const [sala, cs] of Object.entries(celulas)) {
  if (semDia.has(sala)) continue;
  const temFogo = (mapa.luzes ?? []).some((l) => cs.some((c) => c.x === l.pos.x && c.y === l.pos.y));
  if (temFogo) continue;
  let seteiras = 0;
  for (const c of cs) {
    for (const [x, y, lado] of [[c.x, c.y, 'N'], [c.x, c.y, 'O'], [c.x, c.y + 1, 'N'], [c.x + 1, c.y, 'O']]) {
      if (!f.inside(x, y)) continue;
      const v = lado === 'N' ? f.paredeN[y * f.w + x] : f.paredeO[y * f.w + x];
      if (v === ARESTA.seteira) seteiras += 1;
    }
  }
  if (!seteiras) continue;
  for (const c of cs) if (luz[c.y][c.x] === '0') luz[c.y][c.x] = '1';
  saida[sala] = { seteiras, casas: cs.length };
}
console.log(JSON.stringify({ luz: luz.map((l) => l.join('')), salas: saida }));
'''
    r = motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas),
                         'SEM_DIA': json.dumps(sorted(SEM_LUZ_DO_DIA))})
    if r['salas']:
        print('  penumbra pela seteira (sala com fresta e sem chama dentro):')
        for sala, q in sorted(r['salas'].items()):
            print(f"    {sala:16} {q['casas']:3} casas, {q['seteiras']} seteira(s)")
    else:
        print('  penumbra pela seteira: nenhuma sala (todas tem chama dentro ou nao tem fresta)')
    for sala, porque in sorted(SEM_LUZ_DO_DIA.items()):
        print(f'    {sala:16} fica no BREU de proposito — {porque}')
    return r['luz']


def main():
    base = json.load(open(ENTRADA, encoding='utf-8'))
    base['paredes'] = por_cortinas(base['paredes'])
    h = len(base['terreno'])
    w = len(base['terreno'][0])

    # --- o terreno: LAJE em tudo, e quem barra o passo é a PAREDE, não o glifo.
    #
    # A rocha do importador foi JOGADA FORA de propósito. `derivar-paredes` vira rocha todo "bolsão" que a
    # inundação não alcança, e a inundação dele trata porta como fechada: num castelo com 21 portas, isso
    # transformou 179 casas de sala em pedra maciça — a torre do sudeste inteira, entre outras. Medido: com as
    # portas abertas, essas casas se alcançam sem problema. Aqui o castelo é todo chão, como no Foundry, e a
    # aresta decide. O desenho por baixo mostra onde é pedra; a regra não precisa repetir isso.
    terreno = ['L' * w for _ in range(h)]
    # ... e depois ROCHA no que ninguém alcança NEM COM TODA PORTA ABERTA. Essas casas são a espessura das
    # paredes: o desenho põe pedra ali, e chão fechado por quatro paredes faz `conferir-paredes.mjs` acusar
    # "chão ilhado" — 51 achados na primeira volta. A conta é com as portas ABERTAS de propósito: é a diferença
    # entre "ninguém chega aqui nunca" (pedra) e "está trancado" (sala), e foi tratar porta como fechada que fez
    # `derivar-paredes` transformar a torre do sudeste inteira em rocha.

    # --- a luz: DENTRO no breu, FORA à luz do dia.
    #
    # Dentro é ruína de pedra com teto: a grade nasce no breu e quem acende são as 34 luzes da cena (é o modelo
    # da Mansão e da Onda Eco). Fora é mato ao sol, e tem de ser claro — na primeira volta a grade inteira ficou
    # no breu e o grupo chegava de dia a um mundo preto.
    #
    # Quem separa é a COR, medida casa a casa: o verdor (g menos a média de r e b) vale 19,5 no terceiro quartil
    # do mato e 1,0 no primeiro da pedra, então o corte em 4 parte os dois sem ambiguidade — e a figura que sai
    # desenha a pegada do castelo. O desenho é escuro (é a base sem luz), mas o VERDE continua verde.
    import numpy as np
    from PIL import Image
    casa = np.asarray(Image.open(IMAGEM).convert('RGB').resize((w, h), Image.BOX), dtype=np.float32)
    verdor = casa[..., 1] - (casa[..., 0] + casa[..., 2]) / 2
    fora = verdor > 4
    luz = [''.join('2' if fora[y][x] else '0' for x in range(w)) for y in range(h)]

    mapa = {
        'terreno': terreno,
        'luz': luz,
        # O braseiro apagado de (13,8): `hidden` na cena da FA, o que no Foundry quer dizer apagado. Com a lista de `apagada` o grupo pode acendê-lo (`game/fogo.js`).
        'luzes': base.get('luzes', []) + [{'pos': {'x': 13, 'y': 8}, 'claro': 10, 'penumbra': 10, 'tipo': 'braseiro', 'cor': '#885f0c', 'apagada': True}],
        'paredes': base['paredes'],
        'tracos': base['tracos'],
        **({'tracosTipo': base['tracosTipo']} if base.get('tracosTipo') else {}),
        # SÓ a sobreposição cuja arte está no disco. Quatro das quinze (Shadows, Trees, Walls, AnimationsText)
        # são camadas internas do Foundry e não vêm no pacote da FA; deixá-las na lista faz o jogo pedir um
        # arquivo que não existe — e o servidor de dev responde 200 com o index.html, o que esconde o problema.
        **({'sobreposicoes': [o for o in base['sobreposicoes']
                              if os.path.exists(os.path.join(RAIZ, 'public', 'mapas', 'fa',
                                                             o['url'].rsplit('/', 1)[-1]))]}
           if base.get('sobreposicoes') else {}),
        # Os MARCADORES da FA (`fachest1..3`, `fatrap1`) saem: o texto deles era nota de quem importou ("a FA marcou um baú
        # por aqui"), e o jogador a lia no botão direito (revisão de 2026-11-13). Os baús do castelo são da cena, com o que o
        # livro põe dentro, e a armadilha da entrada é a região do fio (`encounter.js`).
        **({'interativos': [o for o in base['interativos'] if not o['id'].startswith('fa')]}
           if any(not o['id'].startswith('fa') for o in base.get('interativos', [])) else {}),
        'fundo': {'nome': 'castelo.webp', 'url': '/mapas/fa/castelo.webp', 'escala': 100,
                  'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
        # O grupo chega pelo OESTE, onde o desenho põe os degraus de pedra (casas 2,10 e 2,13) — é por ali que a
        # trilha entra. O `grupo` que o importador devolve é o canto (0,0) do Foundry, que não quer dizer nada.
        'grupo': [{'x': 1, 'y': 11}, {'x': 1, 'y': 12}, {'x': 2, 'y': 11}, {'x': 2, 'y': 12}],
        'olhar': {'dx': 1, 'dy': 0},
    }

    vivas = alcance_com_portas_abertas(mapa)
    t = [list(l) for l in terreno]
    pedra = 0
    for y in range(h):
        for x in range(w):
            if f'{x},{y}' not in vivas:
                t[y][x] = 'R'
                pedra += 1
    terreno = [''.join(l) for l in t]
    mapa['terreno'] = terreno

    # --- a LUZ e o OBJETO INTERAGÍVEL têm de morar em casa de chão
    #
    # No Foundry a luz é um ponto solto e o marcador é um `.svg` pregado na parede; aqui os dois moram numa CASA,
    # e casa de pedra não serve: a luz acende dos dois lados da parede e o objeto não tem de onde ser usado (o
    # menu pede 1,5 m). Foi o mesmo conserto da Mansão. Aqui, medido: 4 velas e os 4 marcadores da FA caíram em
    # espessura de parede. Cada um anda para a casa de chão mais perto, e o gerador diz quantos andaram.
    # ORDENADO antes de escolher: `vivas` e um CONJUNTO de strings, e a ordem de um conjunto muda a cada
    # processo (o Python embaralha o hash). No empate entre duas casas a mesma distancia, duas rodadas do
    # gerador punham a luz em casas diferentes — e o arquivo gerado deixava de ser reproduzivel. Medido: dois
    # `python mapa-castelo-fa.py` seguidos davam MD5 diferentes. Mesmo conserto do gerador de Arvore Trovao.
    casas_vivas = sorted((int(k.split(',')[0]), int(k.split(',')[1])) for k in vivas)

    def mais_perto(x, y):
        melhor, dist = None, None
        for (vx, vy) in casas_vivas:
            d = (vx - x) ** 2 + (vy - y) ** 2
            if dist is None or d < dist:
                melhor, dist = (vx, vy), d
        return melhor

    andaram = 0
    for l in mapa['luzes']:
        q = l['pos']
        if f"{q['x']},{q['y']}" not in vivas:
            nx, ny = mais_perto(q['x'], q['y'])
            l['pos'] = {'x': nx, 'y': ny}
            andaram += 1
    for o in mapa.get('interativos', []):
        if f"{o['x']},{o['y']}" not in vivas:
            nx, ny = mais_perto(o['x'], o['y'])
            o['x'], o['y'] = nx, ny
            andaram += 1

    # AS CHAMAS ACENDEM O DESENHO DO CÔMODO. O desenho base é a planta sem luz, e a FA dá a cada cômodo com fogo uma peça
    # ACESA (`Overlays/Lights`): o salão do banquete, o alojamento, o quarto do rei e a capela. Elas existiam aqui e nenhuma
    # chama as ligava, então apagar uma tocha punha o cômodo no breu da regra e deixava a pintura como estava (revisão de
    # 2026-11-13). Agora cada uma vai com a sua chama (`luz.sobreposicao`, que `game/fogo.js` acende e apaga junto).
    # A da capela tem o MESMO nome de arquivo do sarcófago (`Shrine.webp`, 400x200), e o importador pegava o errado: a peça
    # de luz dela (1000x1000) vai para o disco como `ShrineLight.webp`.
    pecas = {o['id']: o for o in mapa.get('sobreposicoes', [])}
    if 'l1' in pecas:
        if os.path.exists(os.path.join(RAIZ, 'public', 'mapas', 'fa', 'ShrineLight.webp')):
            pecas['l1']['url'] = '/mapas/fa/ShrineLight.webp'
        else:
            mapa['sobreposicoes'] = [o for o in mapa['sobreposicoes'] if o['id'] != 'l1']
            del pecas['l1']
    CHAMA_DA_PECA = {(15, 12): 'l2', (22, 11): 'l3', (27, 6): 'l4', (13, 8): 'l1'}
    for l in mapa['luzes']:
        pid = CHAMA_DA_PECA.get((l['pos']['x'], l['pos']['y']))
        if pid and pid in pecas:
            l['sobreposicao'] = pid
            pecas[pid]['ligada'] = not l.get('apagada', False)

    # A luz que fica do lado de FORA (conferido DEPOIS de elas andarem: a que se mudou para o mato
    # também precisa da marca) só acende quando escurece (`soNoEscuro`, de `rules/luz.js`). Sem isso ela é
    # enfeite inerte: o mato já está em claro na grade, e chama nenhuma acrescenta nada à luz do dia.
    for l in mapa['luzes']:
        q = l['pos']
        if 0 <= q['y'] < h and 0 <= q['x'] < w and luz[q['y']][q['x']] == '2':
            l['soNoEscuro'] = True

    celulas = inundar(mapa)
    todas = portas(mapa)
    mapa['luz'] = por_seteira(mapa, celulas)

    # --- os pontos do capítulo, medidos sobre as salas que acabaram de sair
    def meio(nome):
        cs = celulas.get(nome) or []
        if not cs:
            sys.exit(f'a sala {nome} ficou vazia: nao da para tirar ponto dela')
        cx = sum(c['x'] for c in cs) / len(cs)
        cy = sum(c['y'] for c in cs) / len(cs)
        return min(cs, key=lambda c: (c['x'] - cx) ** 2 + (c['y'] - cy) ** 2)

    def porta_entre(a, b):
        """A aresta de porta que liga `a` a `b`. `b` None quer dizer "para fora de toda sala" (o portao)."""
        emSala = {f"{c['x']},{c['y']}" for cs in celulas.values() for c in cs}
        da = {f"{c['x']},{c['y']}" for c in celulas.get(a, [])}
        db = (emSala - da) if b is None else {f"{c['x']},{c['y']}" for c in celulas.get(b, [])}
        if b is None:
            db = None          # fora de TODA sala
        for (p, q) in todas:
            ka, kb = f"{p['x']},{p['y']}", f"{q['x']},{q['y']}"
            if db is None:
                if (ka in da and kb not in emSala) or (kb in da and ka not in emSala):
                    return [p, q]
            elif (ka in da and kb in db) or (ka in db and kb in da):
                return [p, q]
        return None

    def portas_para_fora(a, lado=None):
        """TODA porta da sala `a` para fora de toda sala. `lado='N'` só as em que a casa de fora fica ao norte.

        O lado importa porque a ruína tem TRÊS portas para chão sem sala: as duas da lona, ao norte, e a
        "porta intacta a leste" que o livro também descreve, que dá no corredor nordeste (6 casas, sem nome).
        """
        emSala = {f"{c['x']},{c['y']}" for cs in celulas.values() for c in cs}
        da = {f"{c['x']},{c['y']}" for c in celulas.get(a, [])}
        achadas = []
        for (p, q) in todas:
            ka, kb = f"{p['x']},{p['y']}", f"{q['x']},{q['y']}"
            if ka in da and kb not in emSala:
                dentro, fora = p, q
            elif kb in da and ka not in emSala:
                dentro, fora = q, p
            else:
                continue
            if lado == 'N' and fora['y'] >= dentro['y']:
                continue
            achadas.append([p, q])
        return achadas

    arestas = {}
    # As quatro portas com dono (só abrem pela interação própria: chave, barra, força). Os pares saem do mapa:
    # listando que salas cada uma das 24 portas liga, a do urso é a única entre a guarda e a torre do sudeste, e
    # o portão traseiro a única do corredor para o lado de fora. Na primeira volta eu tinha chutado `corredor
    # <-> torreUrso` e `corredor <-> postoSul`, que não existem, e as duas ficaram sem aresta — `abrir()` nelas
    # não fazia nada e ninguém percebia.
    # A PORTA ESCORADA É A MESMA DO URSO, e isso vem do livro: a área 12 diz "o muro ao sul está desmoronado,
    # mas uma porta de madeira BLOQUEADA naquela direção ainda está firme", e a área 13, do outro lado da mesma
    # porta, "a porta para esta sala foi mantida fechada com uma BARRA GROSSA de madeira". Uma porta, uma
    # tranca. O gerador a punha em `guarda <-> salaoEscuro`, a porta OESTE do alojamento — e o comentário do
    # próprio capítulo já dizia "a porta escorada entre a guarda e a torre do urso", ou seja, o código sabia e
    # a fiação não. Resultado medido: o teste de Força CD 15 ficava numa porta que o livro não bloqueia, e a
    # porta que ele bloqueia não tinha teste nenhum.
    for nome, a, b in [('portaUrso', 'guarda', 'torreUrso'), ('portaEscorada', 'guarda', 'torreUrso'),
                       ('portaoTraseiro', 'corredor', None)]:
        p = porta_entre(a, b)
        if p:
            arestas[nome] = [p]

    # A LONA SÃO AS PORTAS DA RUÍNA PARA FORA DO CASTELO, as duas. O livro: "lonas empoeiradas escondem a
    # entrada NORTE para esta área... se os personagens estiverem ativamente procurando POR FORA do castelo por
    # uma entrada escondida, eles podem fazer um teste de Sabedoria (Percepção) com CD 10". O gerador a punha
    # em `ruina <-> salaoEscuro`, que é a CORTINA do sul ("uma grossa cortina bloqueia a área ao sul"), uma
    # aresta INTERNA: medido, partindo do terraço o motor alcança 378 casas e nenhuma delas é um dos lados
    # dela, de modo que não havia como procurar de fora. As portas certas são (18,4)|(18,5) e (19,4)|(19,5), e
    # é a própria FA que as aponta — o ladrilho `Canvas.webp` dela cobre (18,3)-(19,5), em cima das duas.
    arestas['lona'] = portas_para_fora('ruina', lado='N')
    if len(arestas['lona']) != 2:
        sys.exit(f"a ruina tem {len(arestas['lona'])} porta(s) para fora, e a lona precisa das duas")

    # O PONTO `lona` É A CASA DE DENTRO, não a de fora: quem o usa é a fuga da Vyerith, que corre para a lona
    # e passa por ela (`capitulo4-castelo.js`), e `reachable` dela com a porta fechada só enxerga o lado em que
    # ela está. Quem procura de fora não usa este ponto — usa as arestas acima.
    dentroDaRuina = {f"{c['x']},{c['y']}" for c in celulas.get('ruina', [])}
    pontos = {
        'lona': next(p for p in arestas['lona'][0] if f"{p['x']},{p['y']}" in dentroDaRuina),
        'bauUrso': meio('torreUrso'),
        'portaoTraseiro': meio('corredor'),
        'portaEscorada': meio('guarda'),
        # os DOIS ARCOS de cortina ao norte da capela, cada um com a sua porta para o santuário
        'cortinas': [c for c in celulas.get('salaoEscuro', []) if c['y'] == 7],
        # a armadilha é o ladrilho `trap` da FA, cortado no chão da sala dela
        'armadilha': [c for c in celulas.get('salaoArmadilha', []) if 9 <= c['x'] <= 11 and 10 <= c['y'] <= 11],
    }
    pontos['portaUrso'] = [meio('torreUrso')]

    # Dois bandos na MESMA sala (os hobgoblins em duas levas, o banquete e a cozinha) têm de dividir as casas, e
    # não repetir as mesmas: senão quatro hobgoblins nascem em cima de duas casas.
    # O BANDO DESVIA DO MÓVEL PINTADO. Os postos são escolhidos antes da mobília, e ficavam em cima dela — e
    # como o móvel agora só entra onde a FA o desenha, o hobgoblin sentado na mesa tirava a mesa do mapa.
    # Aqui o bando prefere as casas sem móvel desenhado, e só volta a usá-las se a sala não tiver outras.
    pintadas = casas_com_movel(len(mapa['terreno'][0]), len(mapa['terreno']))
    print(f'  a FA desenha móvel em {len(pintadas)} casa(s): são elas que a mobília ocupa, e o bando as evita')
    com_movel = {f'{x},{y}' for x, y in pintadas}
    postos = {}
    # ORDENADO: a ordem de um CONJUNTO de strings muda a cada processo, e com ela mudava a ordem em que as
    # salas recebiam posto — duas rodadas do gerador davam `postos` diferentes, e o arquivo deixava de ser
    # reproduzivel. (O outro ponto era a casa mais perto para onde uma luz anda; ver `casas_vivas`.)
    for sala in sorted({s for s, _n in POSTOS.values()}):
        bandos = [g for g, (s2, _n) in POSTOS.items() if s2 == sala]
        total = sum(POSTOS[g][1] for g in bandos)
        sem_movel = [c for c in celulas.get(sala, []) if f"{c['x']},{c['y']}" not in com_movel]
        casas = espalhar(sem_movel if len(sem_movel) >= total else celulas.get(sala, []), total)
        i = 0
        for g in bandos:
            n = POSTOS[g][1]
            postos[g] = casas[i:i + n]
            i += n
    vazios = [g for g, cs in postos.items() if len(cs) < POSTOS[g][1]]
    if vazios:
        sys.exit('sala pequena demais para o bando: ' + ', '.join(vazios))

    def perto_de(sala, outra):
        """A casa de `sala` mais perto do meio de `outra` — a soleira por onde a leva entra."""
        a, b = celulas.get(sala, []), celulas.get(outra, [])
        if not a or not b:
            return None
        bx = sum(c['x'] for c in b) / len(b)
        by = sum(c['y'] for c in b) / len(b)
        return min(a, key=lambda c: (c['x'] - bx) ** 2 + (c['y'] - by) ** 2)

    todo_chao = [c for cs in celulas.values() for c in cs]
    mx = sum(c['x'] for c in todo_chao) / len(todo_chao)
    my = sum(c['y'] for c in todo_chao) / len(todo_chao)
    pontos_cena = {
        # o meio do castelo, de onde o barulho se espalha
        'centro': min(celulas['banquete'], key=lambda c: (c['x'] - mx) ** 2 + (c['y'] - my) ** 2),
        # as soleiras por onde cada leva entra no salão
        'entradaSul': perto_de('torreSul', 'banquete'),
        'entradaNorte': perto_de('alojamentoHob', 'salaoArmadilha'),
        'portaCozinha': perto_de('banquete', 'corredor'),
        'barulhoSul': perto_de('corredor', 'banquete'),
        # para onde o roteiro empurra quem está no quarto do rei
        'foraDoRei': perto_de('guarda', 'rei'),
    }
    faltando = [k for k, v in pontos_cena.items() if v is None]
    if faltando:
        sys.exit('nao deu para medir o ponto: ' + ', '.join(faltando))

    # --- a mobília: posta pelo motor, peça a peça, sem fechar sala nenhuma
    reservado = {f"{c['x']},{c['y']}" for cs in postos.values() for c in cs}
    reservado |= {f"{q['x']},{q['y']}" for q in pontos.get('armadilha', [])}
    reservado |= {f"{q['x']},{q['y']}" for q in mapa['grupo']}
    reservado |= {f"{l['pos']['x']},{l['pos']['y']}" for l in mapa['luzes'] if not l.get('apagada')}
    reservado |= {f"{o['x']},{o['y']}" for o in mapa.get('interativos', [])}
    reservado |= {f"{q['x']},{q['y']}" for q in pontos_cena.values() if q}
    # as DUAS casas de cada porta: móvel na soleira deixa a porta sem lado nenhum para abrir, e
    # `conferir-paredes.mjs` acusa "porta no maciço" — foram 4 na primeira volta.
    for (a, b) in todas:
        reservado.add(f"{a['x']},{a['y']}")
        reservado.add(f"{b['x']},{b['y']}")
    for v in pontos.values():
        for q in ([v] if isinstance(v, dict) else v):
            reservado.add(f"{q['x']},{q['y']}")
    # A FOLHA DE PORTAO CAIDA fica DIANTE DOS PORTOES, que e onde a chegada ao terraco a descreve. O
    # terraco tem 48 casas e nenhuma com movel pintado, entao sem ancora a peca caia na primeira que
    # servisse — (0,13), a beira oeste, a dez casas da entrada. A ancora e a casa do terraco mais perto do
    # salao da armadilha (a area 2, logo dentro dos portoes quebrados).
    def mais_perto(sala, de):
        alvo = celulas.get(de) or []
        cx = sum(c['x'] for c in alvo) / len(alvo)
        cy = sum(c['y'] for c in alvo) / len(alvo)
        return min(celulas.get(sala) or [], key=lambda c: (c['x'] - cx) ** 2 + (c['y'] - cy) ** 2)
    ancoras = {'I': mais_perto('terraco', 'salaoArmadilha')}
    posto_mob = mobiliar(mapa, celulas, reservado, MOBILIA, pintadas, ancoras)
    terreno = posto_mob['terreno']
    mapa['terreno'] = terreno
    postas = sum(posto_mob['postas'].values())
    sobraram = posto_mob['sobraram']

    provas(mapa, celulas, {**pontos, **{f'posto {g}': cs for g, cs in postos.items()},
                           **{f'ponto {k}': v for k, v in pontos_cena.items()}})

    salas = {}
    for nome, _s, _c, _certo in SALAS:
        cs = celulas[nome]
        salas[nome] = {'x0': min(c['x'] for c in cs), 'y0': min(c['y'] for c in cs),
                       'x1': max(c['x'] for c in cs), 'y1': max(c['y'] for c in cs)}

    folhas = arestas_de_porta(mapa)
    print(f'  folhas: {len(folhas)} porta(s) da planta ganham folha (abrem e fecham no menu)')

    castelo = {
        'salas': salas,
        'celulas': celulas,
        'postos': postos,
        'pontos': pontos_cena,
        'desloc': {'x': 0, 'y': 0},
        'arestas': arestas,
        # TODA PORTA DA PLANTA GANHA FOLHA. Sem esta lista `capitulo4-castelo.js portasDaCasa` não acha porta
        # nenhuma, e como a cena declara `portasProprias: true` o menu comum de `game/portas.js` também não
        # entra: nenhuma das portas do castelo abria ou fechava. A planta antiga trazia as portas na mão.
        'folhas': folhas,
        'portas': {},
        **{k: v for k, v in pontos.items()},
    }

    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    cabecalho = (
        '// O CASTELO CRAGMAW (Parte 4), sobre o battlemap da Forgotten Adventures.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-castelo-fa.py` — mude lá e rode de novo. A planta antiga (39x28, desenhada\n'
        '// a mão) está aposentada em `mapa-castelo.py`: a prova visual mostrou a nossa parede correndo por fora\n'
        '// da parede pintada, e é o mesmo castelo em planta diferente.\n'
        '//\n'
        '// A luz: TUDO no breu na grade. O desenho da FA é a base sem luz, e quem acende são as 34 luzes da\n'
        '// cena (31 delas em cone — as seteiras).\n'
        '//\n'
        '// A ARTE não entra no repositório nem na publicação (licença da FA).\n'
    )
    corpo = (
        'export const MAPA_CASTELO = {\n'
        '  terreno: [\n' + ''.join(f'    {um(l)},\n' for l in terreno) + '  ],\n'
        '  luz: [\n' + ''.join(f'    {um(l)},\n' for l in mapa['luz']) + '  ],\n'
        f'  luzes: {um(mapa["luzes"])},\n'
        '  paredes: {\n'
        + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in mapa['paredes'][lado]) + '    ],\n'
                  for lado in ('n', 'o'))
        + '  },\n'
        f'  tracos: {um(mapa["tracos"])},\n'
        + (f'  tracosTipo: {um(mapa["tracosTipo"])},\n' if 'tracosTipo' in mapa else '')
        + (f'  sobreposicoes: {um(mapa["sobreposicoes"])},\n' if 'sobreposicoes' in mapa else '')
        + (f'  interativos: {um(mapa["interativos"])},\n' if 'interativos' in mapa else '')
        + f'  fundo: {um(mapa["fundo"])},\n'
        f'  grupo: {um(mapa["grupo"])},\n'
        '};\n\n'
        'export const CASTELO = ' + json.dumps(castelo, ensure_ascii=False, indent=2) + ';\n'
    )
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)

    print(f'  escrito: {SAIDA}')
    print(f'  mobília posta nas salas: {postas} casas'
          + (' | coube tudo' if not sobraram else ''))
    if sobraram:
        print('  a receita nao cabe na sala (vem da planta antiga, que tinha salas maiores):')
        for sala, q in sorted(sobraram.items()):
            print(f"    {sala:16} {q['casas']:3} casas livres para {q['receita']:3} peca(s) — ficaram de fora"
                  f" {q['barram']} que barram e {q['baixas']} baixa(s)"
                  + (f" · {q['partidas']} peca(s) de varias casas sairam PARTIDAS" if q.get('partidas') else ''))
    print(f'  luz/objeto que andou para a casa de chão mais perto: {andaram}')
    print(f'  rocha (espessura de parede, ninguem alcanca nem com porta aberta): {pedra} casas')
    print('  salas (casas | semente | certeza):')
    for nome, s, _c, certo in SALAS:
        print(f'    {nome:16} {len(celulas[nome]):3} casas  semente {s}  {"certa" if certo else "A CONFERIR"}')
    print('  postos: ' + ', '.join(f'{g}={len(cs)}' for g, cs in postos.items()))
    print('  pontos da cena: ' + ', '.join(f"{k} {v['x']},{v['y']}" for k, v in pontos_cena.items()))
    print(f'  portas nomeadas achadas: {", ".join(arestas) or "nenhuma"} (de {len(todas)} portas no mapa)')


if __name__ == '__main__':
    main()
