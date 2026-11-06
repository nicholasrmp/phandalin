"""AS RUÍNAS DE ÁRVORE TROVÃO sobre o battlemap da Forgotten Adventures (58x38).

    python src/dev/importar-foundry.py mapas/_cenas/ruins-of-thundertree-58x38.json <imagem> --editor src/dev/_tmp/arvoretrovao-fa.json
    python src/dev/mapa-arvoretrovao-fa.py

Escreve `src/game/arvoretrovao.js`. Mesmo caminho do Poço, do Cume e do Castelo: a planta vem do Foundry
(parede, porta, luz), o terreno vem da COR do desenho, e cada ponto que o capítulo usa é MEDIDO no motor antes
de o arquivo sair.

POR QUE A PLANTA É A DELES. A nossa tinha 91x38... 91x68 e 5.351 casas de chão; a deles tem 58x38 e 2.204. A
prova visual (`prova-fundo.py`) mostra que são plantas DIFERENTES da mesma aldeia: 45% do nosso chão cai fora
do desenho, junto com as casas onde o grupo nascia. Não há enquadramento que conserte — ou se adota a planta
deles, ou não se usa o desenho. Adotou-se.

O QUE O PACOTE DA FA DÁ, e que vale mais que o mapa:
  - TRÊS VERSÕES do mapa inteiro: com copa, sem copa e sem telhado. A base aqui é a SEM TELHADO, porque o jogo
    mostra o interior das casas; e a diferença entre "com copa" e "sem copa" É a copa, recortada pixel a pixel,
    que vira a camada de frente (a folhagem que passa por cima das fichas). Sem heurística de cor nenhuma.
  - 287 paredes em 133 traços, com 17 PORTAS, cada uma no vão desenhado.
  - 3 luzes, e a terceira não é tocha: é `smokepatch` VERDE (`#598000`), `bright 0`, e com `walls: false` — ela
    atravessa parede de propósito. É a fumaça venenosa do dragão, e a FA a põe no anel de pedra do alto do
    mapa. É isso que diz onde é o covil.
  - `environment`: `globalLight` ligado e `darknessLevel: 0`. A aldeia é de DIA, e por isso a grade de luz
    nasce toda clara — ao contrário do Castelo, que nasce no breu.
  - 3 sons posicionais (mata e fogueira) que o nosso motor ainda não sabe tocar: ficam de fora, anotados.

OS PRÉDIOS SÃO CHUTE POSICIONAL, e isto é para corrigir. A aldeia é ruína aberta: inundar com as portas
fechadas devolve 2.032 das 2.204 casas num pedaço só, então a planta não separa cômodo sozinha. O desenho tem
16 construções e o nosso roteiro nomeia 22; a lista abaixo as amarra pela POSIÇÃO, do sul (por onde o grupo
entra) para o norte, que é mais ou menos como o livro numera. Só a TORRE é certa, porque a luz verde do dragão
a aponta. As outras estão marcadas `False` e saem no relatório com "A CONFERIR".

E A CENA DA FA NÃO RESOLVE ISSO: ela tem 0 `notes` e 0 `drawings`, ou seja, nenhum número de área, nenhum
rótulo de cômodo. O que ela nomeia são os LADRILHOS, e isso resolve outra coisa, que vale guardar: quais
construções estão INTEIRAS. Medido, ladrilho a ladrilho, descontando a moldura certa (x por `width`, y por
`height` — são diferentes num mapa que não é quadrado):
  Roof1 (12,2) → ervas · Roof2 (26,2) + FallenDoor (29,4) → torre · Roof3 (46,2) → casa15 ·
  Roof4 (12,24) + CottageFireplace (13,26) → casa7 · Roof6 (32,30) → celeiro ·
  Roof7 (50,26) + CottageLantern (51,31) → estalagem · Webs (23,19) → escola e a rua ao lado
São SETE construções com telhado (as mesmas sete peças que `recortar_frente` recorta) e QUINZE cascas de
alicerce quebrado. As CINCO que têm porta — torre, casa7, estalagem, ervas, celeiro — são todas delas. Quem
for pôr conteúdo aqui: "entrar", "trancar" e "telhado que some" só existem nessas sete.
"""
import json
import os
import pathlib
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENTRADA = os.path.join(RAIZ, 'src', 'dev', '_tmp', 'arvoretrovao-fa.json')
SAIDA = os.path.join(RAIZ, 'src', 'game', 'arvoretrovao.js')
ARTE = os.path.join(RAIZ, 'mapas', 'Thundertree', 'FA_Battlemaps', 'Thundertree_58x38', 'WebP', '200ppi')
SEM_TELHADO = os.path.join(ARTE, 'Thundertree_NoRoof_Grid_58x38_200ppi.webp')

# nome -> (semente, caixa, certeza). Do sul para o norte.
PREDIOS = [
    ('torre',      (33, 6),  (27, 2, 37, 10), True),    # o galpão ao lado do anel — ver o comentário em `main`
    ('fazenda',    (23, 33), (19, 30, 27, 37), False),
    ('celeiro',    (34, 33), (31, 30, 37, 37), False),
    ('casa9',      (46, 30), (43, 27, 50, 34), False),
    ('estalagem',  (53, 31), (50, 27, 57, 36), False),
    ('guarda',     (41, 27), (39, 24, 44, 30), False),
    ('escola',     (30, 27), (25, 23, 36, 31), False),
    ('casa7',      (14, 28), (11, 24, 18, 32), False),
    ('moinho',     (16, 18), (13, 14, 20, 22), False),
    ('ervas',      (15, 5),  (12, 2, 21, 8), False),
    ('casa12',     (40, 13), (38, 10, 42, 16), False),
    ('loja',       (46, 18), (43, 14, 50, 22), False),
    ('ferraria',   (54, 13), (51, 10, 57, 16), False),
    ('casa15',     (50, 6),  (46, 2, 55, 10), False),
]
# os seis nomes que o roteiro ainda cita e que o desenho não tem construção para: ficam como ÁREA de rua, para
# `naSala` continuar respondendo, e saem no relatório para você decidir se viram prédio ou somem.
# OS NOMES SEM CONSTRUÇÃO QUE O DESENHO DÊ. Viram um quadrado de rua em volta da semente, para `naSala`
# responder. Seis não têm prédio nenhum no desenho; `prefeito` e `casa10` TÊM — dá para ver as paredes e a
# laje na imagem —, mas o musgo tomou o piso inteiro e a cor não acha a borda dele: medido, por dentro essas
# duas ruínas têm verdor 14,5 contra 13,5 e 14,0 do anel em volta, ou seja, o chão de DENTRO é mais verde que
# o de fora, e mais verde que o capim da rua de controle (9,5). Não há limiar que as separe, a parede da FA
# não as fecha (inundar por ela vaza a caixa inteira), e inventar a borda seria chute. Então vão para cá, com
# o defeito dito em voz alta: quem quiser a planta delas desenha no editor (`/editor.html`, ferramenta 5).
SEM_PREDIO = {
    'tecelagem': (24, 20), 'embaixada': (36, 18), 'pescaria': (8, 24),
    'casa19': (28, 12), 'casa20': (44, 6), 'florestal': (20, 25),
    'prefeito': (10, 15), 'casa10': (4, 13),
}

# os moradores, por ninho: quantos e em que sala. O capítulo lê `ARVORE_TROVAO.ninhos`.
# OS BANDOS, do livro — e isto NÃO é chute: `testes-cenas.mjs` já guardava o de-para e as quantidades, de
# quando a planta era a antiga. Zumbis das cinzas 5/4/2 (áreas 3, 8, 11), ramos secos 2/6/8/6 (áreas 1, 2, 5,
# 12), duas aranhas, seis cultistas e o dragão. Fui procurar no teste em vez de adivinhar de novo.
NINHOS = {
    'zumbis': ('guarda', 5),
    'zumbisCavalo': ('estalagem', 4),
    'zumbisFerraria': ('ferraria', 2),
    'ramos1': ('casa7', 2),
    'ramos2': ('celeiro', 6),
    'aranhas': ('escola', 2),
    'culto': ('casa9', 6),
    'dragao': ('torre', 1),
    'reidoth': ('ervas', 1),
}
# Quem é GRANDE ocupa 2 x 2, e a mobília tem de deixar a pegada inteira livre — senão a aranha do armazém
# nasce com um banco dentro dela. Aqui só a aranha gigante e o dragão verde.
NINHOS_GRANDES = {'aranhas', 'dragao'}
# Os dois bandos de mato nascem FORA das casas, como o livro os põe: "no mato a leste" e "nos arbustos ao sul
# do tecelão". São áreas de capim, e o gerador escolhe as casas livres dentro delas.
MATO = {
    'ramos5': ((49, 17, 56, 24), 8),      # matoLeste
    'ramos12': ((20, 21, 27, 27), 6),     # tecelagemSul
}


def motor(programa, extra=None):
    base = pathlib.Path(RAIZ).as_uri()
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module',
                        '-e', programa.replace('@BASE@', base)],
                       cwd=RAIZ, capture_output=True, text=True, env={**os.environ, **(extra or {})})
    if r.returncode:
        sys.exit(f'o motor recusou:\n{r.stderr.strip()}')
    return json.loads(r.stdout.strip().splitlines()[-1])




RAIO_DA_COPA = 1.1        # em casas: abaixo disto a mancha de folha não é árvore, é mato solto
SEPARACAO_DAS_ARVORES = 2.2   # em casas: dois centros mais perto que isto são a MESMA árvore
ALCANCE_DO_TRONCO = 6.0       # em casas: folha mais longe que isto de qualquer tronco é mato solto


def recortar_frente(w, h):
    """Recorta, das três versões da FA, a COPA (uma peça por ÁRVORE) e o TELHADO (uma peça por casa).
    Devolve `(sobreposições, troncos)` e escreve a arte em `public/mapas/fa/` (fora do repositório, licença
    da FA).

    POR QUE A COPA VAI QUEBRADA. Ela era UMA peça sobre o mapa inteiro, e por isso só podia abrir um buraco
    redondo em volta da ficha — apagar a peça apagaria a mata da aldeia. Medido olhando o jogo: o buraco lê
    como se o herói estivesse EM CIMA da árvore, e não debaixo dela. Quebrando a folhagem árvore a árvore, a
    copa daquela árvore some inteira, como o telhado da casa, e o que aparece é o tronco e o chão ao redor.

    AS ÁRVORES SE ACHAM SOZINHAS, sem lista na mão: a copa de uma árvore é um disco, e o centro do disco é um
    máximo local da distância à borda da folhagem. Cada pixel de folha vai para o centro mais próximo
    (Voronoi dentro da máscara). Onde duas copas se encostam, o corte sai reto entre elas — é o preço, e é
    menor que o do buraco redondo. Folha a mais de `ALCANCE_DO_TRONCO` de qualquer centro é mato solto e
    volta para uma peça única que não some (o comportamento antigo).
    """
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    alvo = (w * 100, h * 100)
    ler = lambda f: np.asarray(Image.open(os.path.join(ARTE, f)).convert('RGB').resize(alvo, Image.LANCZOS), dtype=np.int16)
    g = ler('Thundertree_Grid_58x38_200ppi .webp')
    nc = ler('Thundertree_NoCanopy_Grid_58x38_200ppi.webp')
    nr = ler('Thundertree_NoRoof_Grid_58x38_200ppi.webp')
    copa = np.abs(nr - nc).mean(axis=2) > 16
    teto = np.abs(g - nr).mean(axis=2) > 16
    saida = os.path.join(RAIZ, 'public', 'mapas', 'fa')
    os.makedirs(saida, exist_ok=True)
    # a leva anterior sai antes, senão uma peça que deixou de existir fica no disco confundindo quem olhar
    for velho in pathlib.Path(saida).glob('arvoretrovao-*.webp'):
        velho.unlink()
    Image.fromarray(nc.astype(np.uint8)).save(os.path.join(saida, 'arvoretrovao.webp'), 'WEBP', quality=88, method=5)

    def guardar(mascara, fonte, nome, modo):
        """Recorta a máscara da arte, grava o webp e devolve a sobreposição com a caixa certa."""
        ys, xs = np.where(mascara)
        x0, y0 = int(xs.min()) // 100, int(ys.min()) // 100
        x1, y1 = int(xs.max()) // 100 + 1, int(ys.max()) // 100 + 1
        recorte = np.dstack([fonte.astype(np.uint8), mascara.astype(np.uint8) * 255])[y0*100:y1*100, x0*100:x1*100]
        Image.fromarray(recorte, 'RGBA').save(os.path.join(saida, f'{nome}.webp'), 'WEBP', quality=86, method=5)
        return {'id': nome, 'url': f'/mapas/fa/{nome}.webp', 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0,
                'ligada': True, 'frente': True, 'oclusao': 0, 'modo': modo}

    # --- a COPA, árvore a árvore
    C = 100
    # a máscara da folha é rendada (folha sim, folha não): fecha-se para achar o DISCO da copa, e o desenho
    # continua saindo da máscara crua, que é o recorte exato da arte
    cheia = ndimage.binary_opening(ndimage.binary_closing(copa, np.ones((9, 9))), np.ones((7, 7)))
    dist = ndimage.distance_transform_edt(cheia)
    pico = (dist >= ndimage.maximum_filter(dist, size=int(SEPARACAO_DAS_ARVORES * C) | 1) - 1e-6) \
        & (dist > RAIO_DA_COPA * C)
    rot, n = ndimage.label(pico, structure=np.ones((3, 3)))
    centros = ndimage.center_of_mass(pico, rot, range(1, n + 1))
    marcas = np.zeros(copa.shape, np.int32)
    for i, (cy, cx) in enumerate(centros, 1):
        marcas[int(cy), int(cx)] = i
    perto, (iy, ix) = ndimage.distance_transform_edt(marcas == 0, return_indices=True)
    arvore = np.where(copa & (perto <= ALCANCE_DO_TRONCO * C), marcas[iy, ix], 0)
    pecas = []
    troncos = []
    for i in range(1, n + 1):
        m = arvore == i
        if m.sum() < 2 * C * C:        # menos de duas casas de folha: não é árvore
            arvore[m] = 0
            continue
        cy, cx = centros[i - 1]
        pecas.append(guardar(m, nr, f'arvoretrovao-copa{len(pecas) + 1}', 'peca'))
        troncos.append((int(cx) // C, int(cy) // C))
    resto = copa & (arvore == 0)
    if resto.any():
        # o mato solto — folha de beira de muro, galho solitário — continua numa peça só, que não some
        pecas.append(guardar(resto, nr, 'arvoretrovao-mato', 'ficha'))
    print(f'  copa: {len(troncos)} árvore(s) achada(s), {100*resto.mean()/max(1e-9, copa.mean()):.0f}% da folha '
          f'sobrou como mato solto')

    # --- o TELHADO, mancha a mancha: o fechamento junta telha com telha e separa casa de casa
    rot, n = ndimage.label(ndimage.binary_closing(teto, structure=np.ones((9, 9))))
    areas = ndimage.sum(teto, rot, range(1, n + 1))
    quantas = 0
    for k in (i + 1 for i, a in enumerate(areas) if a > 200 * 200):
        quantas += 1
        pecas.append(guardar((rot == k) & teto, g, f'arvoretrovao-telhado{quantas}', 'peca'))
    print(f'  camada de frente: {len(troncos)} copa(s) + {quantas} telhado(s), um por casa')
    return pecas, sorted(set(troncos))


def alcance_com_portas_abertas(mapa, pegada=1, de=None):
    """As casas que o grupo alcanca com TODA porta aberta. O resto e bolsao, e vira rocha.

    `pegada` 2 pergunta a mesma coisa para uma criatura GRANDE (o dragao), espremendo onde o SRD deixa: e o
    que diz se uma arvore nova fechou um vao que o dragao usava.
    """
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
  if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
}
const p = Number(process.env.PEGADA);
const cabe = (x, y) => {
  for (let j = 0; j < p; j++) for (let i = 0; i < p; i++) if (!f.inside(x + i, y + j) || f.blocksMove(x + i, y + j)) return false;
  return true;
};
// SEM espremer de proposito: a pergunta e se o vao continua LARGO, e o dragao so espreme quando precisa.
const alc = f.reachable(JSON.parse(process.env.DE), 100000, () => false, cabe, p);
console.log(JSON.stringify([...(alc.keys ? alc.keys() : alc)]));
'''
    return set(motor(programa, {'MAPA': json.dumps(mapa), 'PEGADA': str(pegada),
                                'DE': json.dumps(de or mapa['grupo'][0])}))


def espalhar(casas, quantas):
    """`quantas` casas da sala, as mais espalhadas: comeca no meio e vai pegando a mais longe."""
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


def inundar(mapa, predios):
    """Cada prédio, inundado da semente dentro da caixa dele, pelo motor."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
// A PORTA FICA FECHADA NA INUNDAÇÃO, e é ela que segura o prédio dentro de si. Tentei abri-las, para a torre
// pegar o salão e o anel de uma vez: a estalagem inchou de 16 para 38 casas e as ervas para 41, porque o
// flood sai pela porta da frente e segue pela soleira de pedra, que não é capim. A torre se resolve de outro
// jeito — semeada na fumaça verde, mais o miolo cercado logo abaixo.
const salas = JSON.parse(process.env.SALAS);
const dono = new Map();
const saida = {};
const porParede = [];
for (const [nome, [sx0, sy0], [x0, y0, x1, y1], fixa, soParede] of salas) {
  // A SEMENTE É MEDIDA, não dada: dentro da caixa do prédio, procura-se o MAIOR pedaço de chão que não é
  // capim, e é dele que se inunda. Semente na mão errava feio nas ruínas tomadas pelo mato — a "casa9" saía
  // com 1 casa porque o ponto que eu dei tinha virado grama.
  let [sx, sy] = [sx0, sy0];
  // SEMENTE FIXA: quando ela foi MEDIDA (a torre, pela fumaça verde do dragão), é ela que vale. Sem isto a
  // busca abaixo a sobrescrevia pela maior mancha da caixa — e a maior mancha da torre é o salão retangular,
  // não o anel onde a FA põe o covil.
  let melhor = fixa ? Infinity : -1;
  for (let yy = y0; yy <= y1; yy += 1) for (let xx = x0; xx <= x1; xx += 1) {
    if (!f.inside(xx, yy) || f.blocksMove(xx, yy) || dono.has(`${xx},${yy}`)) continue;
    if (f.surfaceAt(xx, yy) === 'grama') continue;
    const v = new Set([`${xx},${yy}`]); const q = [[xx, yy]]; let n = 0;
    while (q.length) { const [px, py] = q.pop(); n += 1;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const nx = px + dx, ny = py + dy;
        if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue;
        if (!f.inside(nx, ny) || f.blocksMove(nx, ny) || v.has(`${nx},${ny}`) || dono.has(`${nx},${ny}`)) continue;
        if (f.surfaceAt(nx, ny) === 'grama' || !f.passa(px, py, nx, ny, 'passo')) continue;
        v.add(`${nx},${ny}`); q.push([nx, ny]); } }
    if (n > melhor) { melhor = n; sx = xx; sy = yy; }
  }
  // SÓ O CHÃO DE DENTRO. A ruína é aberta, e inundar por caixa vazava para a rua: a "escola" pegava 96
  // casas, metade delas capim. O piso da construção é pedra ou tábua e o de fora é mato, e o terreno já
  // separa os dois pela cor — então o prédio é o que a semente alcança SEM pisar na grama.
  //
  // ... MENOS ONDE A COR NÃO SEPARA. Duas ruínas do oeste (`prefeito` e `casa10`) saíam com UMA casa cada:
  // medido na própria imagem, a laje delas tem verdor 13,0 e 11,5 contra 9,5 do capim da rua de controle —
  // o mato tomou o piso e, pela cor, o chão de dentro é MAIS verde que o de fora. Não há limiar global que
  // as separe. Quando a conta do capim devolve quase nada, a pergunta muda de instrumento: inunda-se de
  // novo PELA PAREDE, que a Forgotten Adventures declara com precisão, e aceita-se o resultado só se ele
  // ficar dentro da caixa (senão a parede tem brecha e a inundação vaza para a aldeia inteira).
  const inundar1 = (semGrama) => {
    const vistos = new Set([`${sx},${sy}`]);
    const fila = [[sx, sy]];
    const out = [];
    while (fila.length) {
      const [x, y] = fila.pop();
      if (dono.has(`${x},${y}`)) continue;
      out.push({ x, y });
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue;
        if (!f.inside(nx, ny) || f.blocksMove(nx, ny) || vistos.has(`${nx},${ny}`) || dono.has(`${nx},${ny}`)) continue;
        if (!f.passa(x, y, nx, ny, 'passo')) continue;
        if (semGrama && f.surfaceAt(nx, ny) === 'grama') continue;
        vistos.add(`${nx},${ny}`); fila.push([nx, ny]);
      }
    }
    return out;
  };
  let casas = [];
  if (f.inside(sx, sy) && !f.blocksMove(sx, sy) && !dono.has(`${sx},${sy}`)) {
    // A COR DECIDE, E DEPOIS SE TAPAM OS BURACOS. A conta da cor ("o piso é pedra, o de fora é mato") é o
    // que impede o prédio de vazar pela própria porta — tentar a PAREDE primeiro inchou a estalagem de 16
    // para 38 casas, rua adentro. Mas ela erra onde o mato tomou o chão DE DENTRO: a torre é um aro de
    // pedra com o miolo de capim, e a cor pegava só o aro, deixando o covil do dragão — onde a FA põe a
    // fumaça verde — fora do prédio.
    //
    // Então, depois de inundar pela cor, acrescenta-se o que ficou CERCADO por ela: dentro da caixa, o que
    // não se alcança a partir da borda sem passar pelo prédio é miolo dele. Isso enche o anel e não toca em
    // prédio nenhum sem buraco. A parede continua como plano B, para quando a cor não devolve quase nada.
    const caixa = (x1 - x0 + 1) * (y1 - y0 + 1);
    // `soParede`: o prédio é um cômodo FECHADO e medido (a torre: 25 arestas de parede e uma porta), e aí a
    // parede é instrumento melhor que a cor — que lá dentro vê musgo e chama de capim.
    casas = soParede ? [] : inundar1(true);
    if (casas.length < 3) {
      const pelaParede = inundar1(false);
      if (pelaParede.length >= 3 && pelaParede.length <= caixa * 0.7) {
        casas = pelaParede;
        porParede.push(`${nome} (${casas.length} casas, pela parede)`);
      }
    }
    // (Houve aqui um passo que acrescentava o que o prédio CERCA, feito para o anel da torre. Saiu junto com
    // ele: o anel foi abandonado — ver o comentário da torre em `main` —, e o passo custava 2 casas à torre
    // que quebravam a conferência de borda fechada, mais 1 ao celeiro, 1 à casa9 e 3 à casa7, sem ganho.)
    for (const c of casas) dono.set(`${c.x},${c.y}`, nome);
  }
  saida[nome] = casas;
}
console.log(JSON.stringify({ saida, porParede }));
'''
    return motor(programa, {'MAPA': json.dumps(mapa),
                            'SALAS': json.dumps([[n, list(s), list(c), bool(fx), bool(pp)] for n, s, c, fx, pp in predios])})


# A MOBÍLIA, prédio a prédio. Veio da planta ANTIGA (91x68), onde 93 peças estavam postas à mão; a planta da
# FA tem outras casas, então o que se guarda é a LISTA DE CADA PRÉDIO, não a coordenada. Cada peça tem um
# texto de "Examinar" em `game/arvoretrovao-exames.js`, e algumas rendem mais (o casulo do elfo com a poção e
# as 23 po do livro, o alçapão do telhado da guarnição, a estátua de Palien que se derruba).
#
# AS 38 PEÇAS DE FORA NÃO VOLTAM: 32 cercas, 4 cercas caídas e 4 portões. O battlemap da FA já desenha a cerca
# e o portão de cada quintal, e como o mapa é pintado o tabuleiro NÃO redesenha móvel nenhum (só o marcado
# `sobreOFundo`). Elas virariam 38 pontos invisíveis de "Examinar a cerca" em casas que eu teria de inventar.
# As duas peças de fora que o roteiro usa — a estátua e a placa — voltam, e com casa medida.
MOBILIA = {
    'estalagem': ['banco', 'barrisRack', 'cubaCerveja', 'fogao', 'prateleira'],
    'casa9':     ['beliche', 'cadeira', 'cadeira', 'fogao', 'mesaPosta'],
    'florestal': ['camaCampo', 'fogueiraPanela', 'mesaFerramentas', 'secadorErvas', 'trapos'],
    # `arcaDragao` é a ARCA do mago que o dragão dorme em cima (glifo `t`, superfície `arca`): o capítulo a
    # abre pela superfície, não pela variante, e sem ela `cena-node/tesouros.mjs` não acha o tesouro da torre.
    # as duas aranhas mortas saíram daqui: elas estão DESENHADAS no capim ao sul, e agora ficam lá (ver `fixas`)
    'torre':     ['arcaDragao', 'tesouroDragao', 'tesouroPouco'],
    'guarda':    ['alcapaoFechado', 'beliche', 'beliche'],
    # o casulo do elfo (o tesouro da área 6: poção de cura, 23 po, 35 pp) mora COM as aranhas: estava na
    # `loja`, a 17 casas da aranha mais perto, porque a lista veio da planta antiga
    # o armazém das aranhas (o ladrilho `Webs` da FA cai aqui): prateleiras, como o capítulo o descreve,
    # e os dois casulos. O banco, a cadeira e a lousa saíram: eram mobília de escola, nome que a planta
    # antiga dava a esta construção, e não cabiam com duas criaturas Grandes em 12 casas.
    'escola':    ['casuloCorpo', 'casuloElfo', 'prateleira', 'prateleira'],
    'casa7':     ['banco', 'banquinho', 'trapos'],
    'ervas':     ['banquinho', 'prateleira', 'saco'],
    'loja':      ['prateleira'],
    'ferraria':  ['bigorna', 'fole', 'mesaFerramentas'],
    'pescaria':  ['baldeBanco', 'redes', 'tabuas'],
    'prefeito':  ['camaViuva', 'escrivaninha'],
    'moinho':    ['baldeBanco', 'mo'],
    'embaixada': ['banco', 'escrivaninha'],
    'fazenda':   ['cocho'],
    'casa10':    ['prateleira'],
    'casa12':    ['guardaRoupa'],
    'casa15':    ['roca'],
    'tecelagem': ['tear'],
}

# `^` barra o passo e dá cobertura; `&` é peça baixa, que se pisa. O de cada peça é o que ela tinha na planta
# antiga — quem decidiu foi quem desenhou a mobília, não eu.
GLIFO_DA_PECA = {
    'arcaDragao': 't', 'alcapaoFechado': '&', 'lareira': '^', 'portaCaida': '&', 'aranhaMorta': '^', 'baldeBanco': '&', 'banco': '^', 'banquinho': '&',
    'barrisRack': '^', 'beliche': '^', 'bigorna': '^', 'cadeira': '^', 'camaCampo': '&', 'camaViuva': '^',
    'casuloCorpo': '^', 'casuloElfo': '^', 'cocho': '^', 'cubaCerveja': '^', 'escrivaninha': '^',
    'estatuaPalien': '^', 'fogao': '^', 'fogueiraPanela': '^', 'fole': '^', 'guardaRoupa': '^', 'lousa': '^',
    'mesaFerramentas': '^', 'mesaPosta': '^', 'mo': '^', 'placaCaveira': '^', 'prateleira': '^',
    'redes': '^', 'roca': '^', 'saco': '&', 'secadorErvas': '^', 'tabuas': '&', 'tear': '^', 'tesouroDragao': '^',
    'tesouroPouco': '&', 'trapos': '&',
}


def mobiliar(mapa, celulas, reservado, vivas, receitas, fixas):
    """Poe a mobilia NO MOTOR, peca a peca, e devolve o terreno novo mais a lista `props` (casa e variante).

    Mesma ideia do Castelo (`mapa-castelo-fa.py mobiliar`), com uma diferenca: la o que importa e o GLIFO, aqui
    importa tambem QUAL peca ficou em qual casa, porque cada variante tem o seu texto de "Examinar". A peca que
    barra passo (`^`) so entra se a sala continuar inteira depois dela e o grupo continuar alcancando cada casa
    livre dela; a peca baixa (`&`) entra sempre, espalhada. `fixas` sao as que ja tem casa decidida (a estatua
    da praca e a placa da estrada), e para essas a conta e o mapa inteiro continuar alcancavel.
    """
    programa = r"""
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const GRID = await import('@BASE@/src/core/grid.js');
const { GLIFOS, ARESTA } = GRID;
const mapa = JSON.parse(process.env.MAPA);
const celulas = JSON.parse(process.env.CELULAS);
const reservado = new Set(JSON.parse(process.env.RESERVADO));
const vivas = JSON.parse(process.env.VIVAS);
const receitas = JSON.parse(process.env.RECEITAS);
const glifoDe = JSON.parse(process.env.GLIFOS_DAS_PECAS);
const fixas = JSON.parse(process.env.FIXAS);
const t = mapa.terreno.map((l) => [...l]);
const monta = () => montarCampo({ ...mapa, terreno: t.map((l) => l.join('')) });
const barra = (g) => GLIFOS[g]?.kind === 3;
// so o que o tabuleiro trata como MOBILIA entra em `props`: a arca do dragao poe o glifo dela e fica
// fora da lista, porque o capitulo a abre pela SUPERFICIE ('arca') e ela nao tem texto de Examinar
const ehMobilia = (g) => g === '^' || g === '&';
const props = [];
const foraDeProps = [];
const chave = (c) => `${c.x},${c.y}`;

const abrirPortas = (f) => {
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
    if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
  }
};

/** Toda casa livre da sala se alcanca de qualquer outra, e o grupo alcanca cada uma delas. */
function inteira(f, cs) {
  // AS PORTAS ABREM ANTES DE MEDIR. O prédio agora são todos os cômodos dele (ver `inundar`), e dois cômodos
  // ligados por porta FECHADA nunca saem "inteiros" — com isso toda peça que barra passo era recusada, e a
  // estalagem perdeu as cinco dela de uma vez.
  abrirPortas(f);
  const livres = cs.filter((c) => !f.blocksMove(c.x, c.y));
  if (!livres.length) return false;
  const dentro = new Set(livres.map(chave));
  const vistos = new Set([chave(livres[0])]);
  const fila = [livres[0]];
  while (fila.length) {
    const p = fila.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (!dentro.has(chave(q)) || vistos.has(chave(q))) continue;
      if (f.blocksMove(q.x, q.y) || !f.passa(p.x, p.y, q.x, q.y, 'passo')) continue;
      vistos.add(chave(q)); fila.push(q);
    }
  }
  if (vistos.size !== livres.length) return false;
  const alc = f.reachable(mapa.grupo[0], 100000);
  return livres.every((c) => alc.has(chave(c)));
}

/** O mapa inteiro continua alcancavel, menos a propria casa da peca? (peca fora de predio) */
function naoIlha(f, posta) {
  abrirPortas(f);
  const alc = f.reachable(mapa.grupo[0], 100000);
  // as casas que JA levaram peca tambem saem da conta: elas nao sao mais alcancaveis de proposito, e sem
  // esta ressalva a segunda peca fixa era sempre reprovada pela primeira
  const tomadas = new Set([...props, ...foraDeProps].map(chave));
  return vivas.every((k) => k === posta || tomadas.has(k) || alc.has(k));
}

const sobraram = {};
for (const { variante, casas } of fixas) {
  const g = glifoDe[variante] ?? '^';
  let posta = false;
  for (const { x, y } of casas) {
    const antes = t[y][x];
    t[y][x] = g;
    if (barra(g) && !naoIlha(monta(), `${x},${y}`)) { t[y][x] = antes; continue; }
    (ehMobilia(g) ? props : foraDeProps).push({ x, y, variante });
    posta = true;
    break;
  }
  if (!posta) sobraram[variante] = 1;
}

for (const [sala, receita] of Object.entries(receitas)) {
  const postas = new Set([...props, ...foraDeProps].map(chave));
  const cs = (celulas[sala] ?? []).filter((c) => !reservado.has(chave(c)) && !postas.has(chave(c)));
  if (!cs.length) { sobraram[sala] = receita.length; continue; }
  const ocupadas = new Set();
  const baixas = receita.filter((v) => !barra(glifoDe[v] ?? '^'));
  for (let i = 0; i < baixas.length && i < cs.length; i += 1) {
    const c = cs[Math.floor((i * cs.length) / Math.max(baixas.length, 1))];
    if (ocupadas.has(chave(c))) continue;
    t[c.y][c.x] = glifoDe[baixas[i]];
    ocupadas.add(chave(c));
    (ehMobilia(glifoDe[baixas[i]]) ? props : foraDeProps).push({ x: c.x, y: c.y, variante: baixas[i] });
  }
  let faltou = 0;
  for (const v of receita.filter((v) => barra(glifoDe[v] ?? '^'))) {
    let posta = false;
    for (const c of cs) {
      if (ocupadas.has(chave(c))) continue;
      const antes = t[c.y][c.x];
      t[c.y][c.x] = glifoDe[v];
      if (inteira(monta(), celulas[sala])) {
        ocupadas.add(chave(c));
        (ehMobilia(glifoDe[v]) ? props : foraDeProps).push({ x: c.x, y: c.y, variante: v });
        posta = true;
        break;
      }
      t[c.y][c.x] = antes;
    }
    if (!posta) faltou += 1;
  }
  if (faltou) sobraram[sala] = faltou;
}
console.log(JSON.stringify({ terreno: t.map((l) => l.join('')), props, foraDeProps, sobraram }));
"""
    return motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas),
                            'RESERVADO': json.dumps(sorted(reservado)), 'VIVAS': json.dumps(sorted(vivas)),
                            'RECEITAS': json.dumps(receitas), 'FIXAS': json.dumps(fixas),
                            'GLIFOS_DAS_PECAS': json.dumps(GLIFO_DA_PECA)})


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


def portas_de(mapa, celulas):
    """As casas do comodo que tem uma PORTA na aresta para fora dele, perguntando ao motor.

    A planta antiga, desenhada a mao, dava a torre como um anel com um VAO aberto de duas casas, e o ponto da
    porta era o chute "a casa de baixo mais perto do meio". A da FA e um predio de verdade: tres portas de uma
    folha, fechadas. Entao o ponto deixa de ser chute e passa a ser medido.
    """
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const cs = JSON.parse(process.env.CELULAS);
const dentro = new Set(cs.map((c) => `${c.x},${c.y}`));
const achadas = [];
for (const c of cs) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  const v = { x: c.x + dx, y: c.y + dy };
  if (dentro.has(`${v.x},${v.y}`) || !f.inside(v.x, v.y)) continue;
  const a = f.aresta(c.x, c.y, v.x, v.y);
  if (a === ARESTA.porta || a === ARESTA.aberta) achadas.push({ x: c.x, y: c.y, fx: v.x, fy: v.y });
}
console.log(JSON.stringify(achadas));
'''
    return motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas)})


def provas(mapa, celulas, pontos, moveis=()):
    """Cada ponto cai em chão, cada prédio tem casa, e o grupo alcança todos. Falha alto se não.

    `moveis` sao as casas que um MOVEL ocupa de proposito (o cofre dos cultistas): elas barram o passo e
    continuam pertencendo ao comodo, entao saem das duas conferencias de "casa bloqueada".
    """
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { ARESTA } = await import('@BASE@/src/core/grid.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const celulas = JSON.parse(process.env.CELULAS);
const pontos = JSON.parse(process.env.PONTOS);
const moveis = new Set(JSON.parse(process.env.MOVEIS));
const erros = [];
for (const [nome, cs] of Object.entries(celulas)) {
  if (!cs.length) { erros.push(`o predio ${nome} ficou vazio: a semente caiu em parede ou noutro predio`); continue; }
  for (const c of cs) if (f.blocksMove(c.x, c.y) && !moveis.has(`${c.x},${c.y}`)) erros.push(`${nome} tem casa bloqueada em (${c.x},${c.y})`);
}
for (const [nome, p] of Object.entries(pontos)) {
  for (const q of [].concat(p)) {
    if (!q) { erros.push(`${nome} nao foi medido`); continue; }
    if (!f.inside(q.x, q.y)) { erros.push(`${nome} (${q.x},${q.y}) fica fora do mapa`); continue; }
    if (f.blocksMove(q.x, q.y) && !moveis.has(`${q.x},${q.y}`)) erros.push(`${nome} (${q.x},${q.y}) caiu em casa bloqueada`);
  }
}
for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
  const i = y * f.w + x;
  if (f.paredeN[i] === ARESTA.porta) f.porAresta(x, y - 1, x, y, ARESTA.aberta);
  if (f.paredeO[i] === ARESTA.porta) f.porAresta(x - 1, y, x, y, ARESTA.aberta);
}
const alc = f.reachable(JSON.parse(process.env.GRUPO)[0], 100000);
for (const [nome, cs] of Object.entries(celulas)) {
  if (cs.length && !cs.some((c) => alc.has(`${c.x},${c.y}`))) erros.push(`o grupo nao alcanca ${nome}`);
}
console.log(JSON.stringify(erros));
'''
    erros = motor(programa, {'MAPA': json.dumps(mapa), 'CELULAS': json.dumps(celulas),
                             'PONTOS': json.dumps(pontos), 'MOVEIS': json.dumps(list(moveis)),
                             'GRUPO': json.dumps(mapa['grupo'])})
    if erros:
        sys.exit('A PLANTA NAO BATE:\n  - ' + '\n  - '.join(erros))


def main():
    import numpy as np
    from PIL import Image
    base = json.load(open(ENTRADA, encoding='utf-8'))
    h, w = len(base['terreno']), len(base['terreno'][0])

    # --- o terreno: mato fora, laje dentro. Quem barra o passo é a PAREDE, não o glifo (modelo do Foundry).
    casa = np.asarray(Image.open(SEM_TELHADO).convert('RGB').resize((w, h), Image.BOX), dtype=np.float32)
    verdor = casa[..., 1] - (casa[..., 0] + casa[..., 2]) / 2
    mato = verdor > 6
    terreno = [''.join(',' if mato[y][x] else 'L' for x in range(w)) for y in range(h)]

    sobreposicoes, troncos = recortar_frente(w, h)

    # A TEIA DAS ARANHAS NÃO ESTÁ NESTE MAPA, e isso é achado, não esquecimento. A FA publica `Webs.webp`
    # como LADRILHO da cena (casa 23,19, 11 x 9), e ladrilho não entra nas três versões achatadas que nós
    # usamos: medido pela cor no nosso fundo, a casa mais clara da caixa dele tem 9,9% de pixel pálido contra
    # 4,2% do controle ao lado — ou seja, não há fio desenhado ali. Pintar `$` (teia, terreno difícil) pela
    # CAIXA do ladrilho daria 75 casas de terreno difícil que o jogador não vê, num mapa pintado em que o
    # tabuleiro não desenha glifo de chão. Então não se pinta. O que o ladrilho diz, e que vale, é ONDE a FA
    # pôs as aranhas: por cima da construção que chamamos `escola`, e não da `loja` — ver `MOBILIA` e o
    # alarme em `capitulo4-arvoretrovao.js`.

    mapa = {
        'terreno': terreno,
        # a cena da FA diz `globalLight` ligado e `darknessLevel: 0`: a aldeia é de dia
        'luz': ['2' * w for _ in range(h)],
        'luzes': base.get('luzes', []),
        'paredes': base['paredes'],
        'tracos': base['tracos'],
        **({'tracosTipo': base['tracosTipo']} if base.get('tracosTipo') else {}),
        'fundo': {'nome': 'arvoretrovao.webp', 'url': '/mapas/fa/arvoretrovao.webp', 'escala': 100,
                  'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
        # TELHADO E COPA, separados, como o Foundry faz — e com comportamentos diferentes.
        #
        # As três versões da FA dizem o que é o quê (medido amostrando pixel conhecido, porque o nome engana):
        # `NoCanopy` é o chão LIMPO, sem copa e sem telhado; `NoRoof` é o chão com a copa; `Grid` tem os dois.
        # A copa é a diferença entre `NoRoof` e `NoCanopy` (17,5% da imagem) e o telhado entre `Grid` e
        # `NoRoof` (8,0%); as duas máscaras se cruzam em 0,04% dos pixels, ou seja, não se pisam.
        #
        # O TELHADO VAI QUEBRADO EM UMA PEÇA POR CASA. A máscara dele tem sete manchas (uma por construção com
        # teto), e cada uma vira uma sobreposição com a caixa dela. Assim, entrar na casa tira o telhado
        # INTEIRO daquela casa — não um buraco em volta da ficha, nem só o cômodo em que ela está. A mancha
        # junta os dois cômodos de uma mesma casa, que é o que se quer: quem entra na cozinha vê a casa toda.
        #
        # A COPA VAI QUEBRADA DO MESMO JEITO, uma peça por ÁRVORE (ver `recortar_frente`): quem entra debaixo
        # de uma árvore some a copa DELA, e as outras ficam. Era uma peça só, e aí o único recurso era um furo
        # redondo em volta da ficha — que lê como se o herói estivesse em cima da árvore. Só o mato solto (2%
        # da folha, galho de beira de muro) continua numa peça com furo redondo.
        'sobreposicoes': sobreposicoes,

        # o grupo entra pela estrada do sul
        # a estrada do sul: o grupo entra por ela, uma casa acima da saída (senão nasce em cima dela)
        'grupo': [{'x': 28, 'y': 34}, {'x': 29, 'y': 34}, {'x': 28, 'y': 35}, {'x': 29, 'y': 35}],
        'olhar': {'dx': 0, 'dy': -1},
    }

    # --- O TRONCO BARRA O PASSO. A planta veio do Foundry, onde quem barra é só a parede, e na cena da FA a
    # árvore é ladrilho: medido, 128 das 129 casas debaixo de copa densa eram pisáveis, e o herói atravessava
    # a árvore. O tronco de cada copa (o centro do disco de folha) vira o glifo `T`, que barra passo e visão
    # como a mata fechada — então a árvore passa a dar cobertura e a cortar linha de tiro, como deve.
    #
    # E O GERADOR CONFERE NO MOTOR: um tronco em vão de porta ou em trilha de uma casa fecharia pedaço da
    # aldeia, e o passo seguinte viraria tudo isso em rocha. Compara-se o alcance do grupo antes e depois; o
    # tronco que custa casa é descartado, e se sobrar perda depois de três rodadas o arquivo não sai.
    # A conta é feita DUAS vezes: para o Médio (o grupo) e para o GRANDE de 2 x 2 (o dragão, que tem de sair
    # da torre e perseguir pela vila). Uma árvore na beira da trilha não fecha nada para o herói e fecha tudo
    # para o dragão, e foi exatamente isso que o teste do dragão pegou na primeira leva.
    livre = {p: alcance_com_portas_abertas(mapa, p) for p in (1, 2)}
    t = [list(l) for l in terreno]
    inicio = {f"{q['x']},{q['y']}" for q in mapa['grupo']}
    postos = [(x, y) for x, y in troncos if f'{x},{y}' in livre[1] and f'{x},{y}' not in inicio]
    caidos = []
    for _rodada in range(4):
        for (x, y) in postos:
            t[y][x] = 'T'
        mapa['terreno'] = [''.join(l) for l in t]
        tronco = {(x, y) for x, y in postos}
        perdidas = set()
        for p in (1, 2):
            vivas = alcance_com_portas_abertas(mapa, p)
            if p == 1:
                vivas1 = vivas
            # a âncora cujo quadrado PEGA um tronco some de direito; a que some sem pegar nenhum é caminho fechado
            toca = lambda k: any((int(k.split(',')[0]) + i, int(k.split(',')[1]) + j) in tronco
                                 for j in range(p) for i in range(p))
            perdidas |= {k for k in livre[p] - vivas if not toca(k)}
        if not perdidas:
            break
        vizinha = lambda q: any(abs(q[0] - int(k.split(',')[0])) <= 2 and abs(q[1] - int(k.split(',')[1])) <= 2
                                for k in perdidas)
        culpados = [q for q in postos if vizinha(q)] or postos
        for (x, y) in culpados:
            t[y][x] = terreno[y][x]
        caidos += culpados
        postos = [q for q in postos if q not in culpados]
    else:
        sys.exit(f'o tronco das árvores ainda fecha {len(perdidas)} casa(s) depois de quatro rodadas: {sorted(perdidas)[:10]}')
    vivas = vivas1
    terreno = [''.join(l) for l in t]
    mapa['terreno'] = terreno
    print(f'  tronco: {len(postos)} árvore(s) barram o passo'
          + (f', {len(caidos)} descartado(s) por fechar caminho do Médio ou do Grande' if caidos else ''))

    # --- rocha no que ninguém alcança nem com as portas abertas (bolsões), como no Castelo.
    # O TRONCO FICA DE FORA desta conta: ele barra o passo, logo não aparece no alcance, e sem esta ressalva
    # as 31 árvores saíam repintadas de `R` — barravam igual, mas o jogo as desenhava como rocha.
    t = [list(l) for l in terreno]
    pedra = 0
    for y in range(h):
        for x in range(w):
            if f'{x},{y}' not in vivas and t[y][x] != 'T':
                t[y][x] = 'R'
                pedra += 1
    terreno = [''.join(l) for l in t]
    mapa['terreno'] = terreno

    # A SEMENTE DA TORRE É A FUMAÇA VERDE. O cabeçalho sempre disse "só a torre é certa, porque a luz verde do
    # dragão a aponta" — e não era verdade: a semente era um par de números na mão, e caiu no salão ao lado do
    # covil. Agora ela é MEDIDA: a luz `#598000` (o `smokepatch` que a FA põe no covil) diz a casa.
    verde = next((l for l in mapa['luzes'] if str(l.get('cor', '')).lower() == '#598000'), None)
    if not verde:
        sys.exit('a luz verde do dragão sumiu da cena da FA: sem ela a torre volta a ser chute')
    # A FUMAÇA NÃO SE APAGA. Ela é `smokepatch` na cena da FA, e o importador antigo a classificava por brilho
    # como 'vela' — o botão direito oferecia "Apagar a vela" em cima do veneno do dragão. O importador agora
    # marca `semChama` sozinho (ver `ehChama` lá), e isto garante a marca neste mapa, que foi importado antes.
    verde['semChama'] = True
    # A TORRE DO DRAGÃO É O ANEL DE PEDRA, e a semente dela é medida. O que `inundar` achava sozinho era o
    # GALPÃO de piso de tábua (27-30, 3-6) ao lado dela; o anel ficava sem dono e o dragão dormia na
    # antessala. A causa é que o nosso terreno marcou o piso do anel como CAPIM (o musgo o cobriu, a mesma
    # falha de cor de `prefeito` e `casa10`), e a conta da cor não entra lá.
    #
    # Quem resolve é a PAREDE, e aqui ela resolve porque o anel é um cômodo FECHADO de verdade: medido, 25
    # arestas de parede e UMA porta, entre (30,5) e (31,5) — do galpão para a torre. Semeado dentro dele, o
    # plano B de `inundar` (inundar pela parede quando a cor não devolve nada) devolve as 24 casas do anel,
    # sem vazar. `DENTRO_DA_TORRE` é uma casa do miolo, lida no desenho ampliado.
    #
    # Tentado antes e medido que NÃO serve: semear na fumaça verde (31,7) — ela cai no vão entre os dois, que
    # é o lugar dos marcadores da FA; semear no aro (34,4) — vira anel com buraco e deixa de ser cômodo;
    # preferir a parede em todo prédio — vaza pela porta da frente (estalagem 16 -> 38).
    DENTRO_DA_TORRE = (34, 5)
    predios = [(n, DENTRO_DA_TORRE if n == 'torre' else sem, cx, ok) for n, sem, cx, ok in PREDIOS]
    # a torre vai com a semente TRAVADA (ver `inundar`): a busca pela maior mancha a jogaria no galpão
    paraInundar = [(n, sem, cx, n == 'torre', n == 'torre') for n, sem, cx, _ok in predios]
    achado = inundar(mapa, paraInundar)
    celulas = achado['saida']
    if achado['porParede']:
        print('  inundado PELA PAREDE (a cor não separava o piso do mato): ' + ', '.join(achado['porParede']))

    # --- a luz: a RUA é de dia, o DENTRO DA CASA é penumbra (há telhado, mesmo em ruína), e por isso a
    # lareira e a lanterna da FA têm o que fazer. Sem isto as três luzes ficam inertes à luz do dia.
    luz = [list(l) for l in mapa['luz']]
    for cs in celulas.values():
        for c in cs:
            luz[c['y']][c['x']] = '1'
    mapa['luz'] = [''.join(l) for l in luz]

    # --- a luz tem de morar em casa de chão, e a que ficar na rua só acende no escuro
    def mais_perto(x, y):
        # ORDENADO antes do `min`: `vivas` é um conjunto, e a ordem de um conjunto de strings muda a cada
        # processo (o Python embaralha o hash). Sem isto, duas rodadas do gerador escolhiam casas diferentes
        # no empate e o arquivo gerado não era reprodutível.
        return min(sorted((int(k.split(',')[0]), int(k.split(',')[1])) for k in vivas),
                   key=lambda q: (q[0] - x) ** 2 + (q[1] - y) ** 2)

    andaram = 0
    for l in mapa['luzes']:
        q = l['pos']
        if f"{q['x']},{q['y']}" not in vivas:
            nx, ny = mais_perto(q['x'], q['y'])
            l['pos'] = {'x': nx, 'y': ny}
            andaram += 1
        if mapa['luz'][l['pos']['y']][l['pos']['x']] == '2':
            l['soNoEscuro'] = True
    # os seis nomes sem construção viram um quadrado de rua em volta da semente, para `naSala` responder
    for nome, (sx, sy) in SEM_PREDIO.items():
        # `vivas` em vez de "não é rocha": desde que a árvore barra o passo, o quadrado de rua pode cair em
        # cima de um tronco, e a sala sairia com uma casa onde ninguém pisa
        celulas[nome] = [{'x': x, 'y': y} for y in range(sy - 1, sy + 2) for x in range(sx - 1, sx + 2)
                         if 0 <= x < w and 0 <= y < h and f'{x},{y}' in vivas]

    def meio(nome, exceto=()):
        """A casa do predio mais perto do centro dele. `exceto` tira as que ja tem dono: sem isso Reidoth e a
        caixa da Mirna caiam na MESMA casa (medido: os dois em 18,4), e o clique no NPC competia com o
        clique no objeto escondido."""
        tomadas = {f"{q['x']},{q['y']}" for q in exceto}
        cs = [c for c in (celulas.get(nome) or []) if f"{c['x']},{c['y']}" not in tomadas]
        if not cs:
            sys.exit(f'o predio {nome} ficou vazio: nao da para tirar ponto dele')
        cx = sum(c['x'] for c in cs) / len(cs)
        cy = sum(c['y'] for c in cs) / len(cs)
        return min(cs, key=lambda c: (c['x'] - cx) ** 2 + (c['y'] - cy) ** 2)

    # Onde cada objeto escondido mora vem do teste, que guardava o do livro: o baú do comerciante na
    # cabana ocidental (casa7) e a caixa da Mirna na loja do herborista (ervas).
    objetos = {'bauMercador': meio('casa7'), 'caixaMirna': meio('ervas'), 'bauCulto': meio('casa9')}

    # O COFRE DOS CULTISTAS É O ÚNICO BAÚ DESENHADO. Os outros dois objetos estão ESCONDIDOS — só aparecem
    # quando alguém procura —, e por isso não vão para o terreno; o cofre está à vista no cômodo, e a cena o
    # abre pela superfície da casa (`surfaceAt === 'bau'`). O glifo `K` BARRA O PASSO, então a casa é
    # conferida no motor: se pôr o cofre ali custar casa a alguém — ao grupo ou ao dragão de 2 x 2 —, ele anda
    # para a casa seguinte da mesma construção. Sem isto, um móvel no meio do cômodo ilha o fundo da sala, que
    # foi exatamente o que aconteceu ao mobiliar o Castelo.
    # A conta é só a do MÉDIO: um móvel no meio de uma cabana em ruína fecha o cômodo para uma criatura
    # Grande, e isso está certo — o dragão não entra na casa de esquina, entra na rua.
    antes = alcance_com_portas_abertas(mapa)
    t = [list(l) for l in terreno]
    centro = objetos['bauCulto']
    fila = [centro] + [c for c in celulas['casa9'] if (c['x'], c['y']) != (centro['x'], centro['y'])]
    for tentou, cand in enumerate(fila):
        t[cand['y']][cand['x']] = 'K'
        mapa['terreno'] = [''.join(l) for l in t]
        perdidas = antes - alcance_com_portas_abertas(mapa) - {f"{cand['x']},{cand['y']}"}
        if not perdidas:
            objetos['bauCulto'] = cand
            if tentou:
                print(f"  cofre: foi para ({cand['x']},{cand['y']}) na {tentou + 1}ª tentativa — as anteriores "
                      f'ilhavam chão')
            break
        t[cand['y']][cand['x']] = terreno[cand['y']][cand['x']]
    else:
        sys.exit('não há casa na casa9 onde o cofre caiba sem ilhar chão')
    terreno = [''.join(l) for l in t]
    mapa['terreno'] = terreno
    movel = f"{objetos['bauCulto']['x']},{objetos['bauCulto']['y']}"

    # A ESTÁTUA DA PRAÇA FICA NA PRAÇA. Ela era `meio('escola')` — dentro de uma construção —, herdado da
    # planta antiga; e desde que o ladrilho `Webs` da FA mostrou que essa construção é o armazém das aranhas,
    # a estátua estava dentro do covil delas, disputando as 12 casas com duas criaturas Grandes. Agora é
    # medida: a casa de RUA (fora de toda construção) mais perto do meio da aldeia, com as oito vizinhas
    # livres — um largo, que é onde se põe estátua. Decidida antes dos bandos, porque `espalhar` começa pelo
    # meio da sala e a aranha nascia em cima dela.
    emConstrucao = {f"{c['x']},{c['y']}" for cs in celulas.values() for c in cs}
    cx = sum(c['x'] for cs in celulas.values() for c in cs) / max(1, len(emConstrucao))
    cy = sum(c['y'] for cs in celulas.values() for c in cs) / max(1, len(emConstrucao))
    livres8 = lambda x, y: all(f'{x + i},{y + j}' in vivas and f'{x + i},{y + j}' not in emConstrucao
                               for j in (-1, 0, 1) for i in (-1, 0, 1))
    # ordenado: ver `mais_perto` — conjunto não tem ordem estável entre processos
    largos = sorted((int(k.split(',')[0]), int(k.split(',')[1])) for k in vivas if k not in emConstrucao)
    largos = [q for q in largos if livres8(q[0], q[1])]
    if not largos:
        sys.exit('não há largo na aldeia para a estátua da praça')
    ex, ey = min(largos, key=lambda q: (q[0] - cx) ** 2 + (q[1] - cy) ** 2)
    estatua = {'x': ex, 'y': ey}
    print(f'  estátua: na rua em ({ex},{ey}), a casa de largo mais perto do meio da aldeia')

    # a casa de cada objeto escondido sai da conta dos bandos: senão o cultista nasce em cima do baú
    tomadas = {f"{q['x']},{q['y']}" for q in objetos.values()} | {f"{estatua['x']},{estatua['y']}"}

    ninhos = {}
    for nome, (sala, quantos) in NINHOS.items():
        # Quem é GRANDE precisa da PEGADA 2 x 2 inteira fora do que já está tomado: a estátua da praça fica no
        # meio do armazém, e sem esta conta a aranha nascia com a estátua dentro dela.
        passo = 2 if nome in NINHOS_GRANDES else 1
        if nome == 'dragao':
            # O DRAGÃO DORME NO COVIL, não na antessala: a casa é a da fumaça verde da FA, se a pegada 2 x 2
            # couber nela. Antes ele nascia no meio das 32 casas da torre, que `espalhar` escolhe pelo
            # centróide — e isso o punha no salão retangular, com o anel de pedra vazio ao lado.
            alvo = {'x': verde['pos']['x'], 'y': verde['pos']['y']}
            if any(c['x'] == alvo['x'] and c['y'] == alvo['y'] for c in celulas.get(sala, [])):
                ninhos[nome] = [alvo]
                continue
        cabe = lambda c: all(f"{c['x'] + i},{c['y'] + j}" not in tomadas
                             for j in range(passo) for i in range(passo))
        ninhos[nome] = espalhar([c for c in celulas.get(sala, []) if cabe(c)], quantos)
    emPredio = {f"{c['x']},{c['y']}" for cs in celulas.values() for c in cs}
    for nome, ((x0, y0, x1, y1), quantos) in MATO.items():
        livres = [{'x': x, 'y': y} for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)
                  if 0 <= x < w and 0 <= y < h and terreno[y][x] != 'R' and f'{x},{y}' in vivas
                  and f'{x},{y}' not in emPredio]
        ninhos[nome] = espalhar(livres, quantos)
        if len(ninhos[nome]) < quantos:
            sys.exit(f'a area de mato {nome} so tem {len(ninhos[nome])} casas livres para {quantos} bichos')

    # A PORTA DA TORRE É MEDIDA, não chutada: das portas que a torre tem na planta da FA, a que fica mais
    # perto de por onde o grupo chega. O capítulo põe gente nela e mede linha de visão a partir dela, então
    # ela precisa ser a casa de dentro que dá para a rua — e não "a casa de baixo mais ao centro", que era o
    # chute herdado da planta antiga (um anel com um vão aberto, que a da FA não tem).
    torre = celulas['torre']
    saidas = portas_de(mapa, torre)
    if not saidas:
        sys.exit('a torre não tem porta nenhuma na planta: o dragão não sai e o grupo não entra')
    chegada = mapa['grupo'][0]
    p = min(saidas, key=lambda q: (q['x'] - chegada['x']) ** 2 + (q['y'] - chegada['y']) ** 2)
    porta = {'x': p['x'], 'y': p['y']}
    print(f"  torre: {len(saidas)} porta(s); a do grupo é ({porta['x']},{porta['y']}) para ({p['fx']},{p['fy']})")
    pontos = {
        'estatua': estatua,
        'portaDaTorre': porta,
        'reidoth': meio('ervas', exceto=list(objetos.values())),
        'chegada': {'x': 28, 'y': 34},
        'saida': [{'x': 27, 'y': 37}, {'x': 28, 'y': 37}, {'x': 29, 'y': 37}],
    }

    # --- A MOBÍLIA. Vem por último, porque reserva o que já foi decidido: as casas do grupo, os objetos
    # escondidos, o ninho de cada bando e os pontos que o capítulo usa. A peça não é DESENHADA (o mapa é
    # pintado, e o tabuleiro só redesenha móvel marcado `sobreOFundo`): ela é o ponto em que o botão direito
    # oferece Examinar, com o texto de `game/arvoretrovao-exames.js`, e o glifo que ela põe no terreno é o que
    # faz a casa valer como cobertura (`^`) ou peça baixa (`&`).
    reservado = {f"{q['x']},{q['y']}" for q in mapa['grupo']}
    reservado |= {f"{q['x']},{q['y']}" for q in objetos.values()}
    reservado |= {f"{c['x']},{c['y']}" for cs in ninhos.values() for c in cs}
    # A CASA DE CADA LUZ sai da conta da mobília: a tocha da estalagem tinha ganhado uma PRATELEIRA em cima,
    # e luz dentro de móvel não é luz, é defeito. A lareira é a exceção, e por isso ela entra por `fixas`,
    # que não olham a reserva: lareira com fogo dentro é exatamente onde a chama deve estar.
    reservado |= {f"{l['pos']['x']},{l['pos']['y']}" for l in mapa['luzes']}
    # a pegada 2 x 2 de quem é Grande, inteira
    reservado |= {f"{c['x'] + i},{c['y'] + j}" for nome in NINHOS_GRANDES for c in ninhos.get(nome, [])
                  for j in (0, 1) for i in (0, 1)}
    reservado |= {f"{q['x']},{q['y']}" for v in pontos.values() for q in (v if isinstance(v, list) else [v])}
    # A PLACA DA CAVEIRA fica na estrada por onde o grupo chega — é o aviso que o livro põe na entrada da
    # aldeia. A casa é a vizinha livre da chegada, medida, para não nascer ninguém em cima dela.
    perto = sorted(((dx, dy) for dx in range(-3, 4) for dy in range(-3, 4) if (dx, dy) != (0, 0)),
                   key=lambda d: d[0] ** 2 + d[1] ** 2)
    vizinhas = [{'x': chegada['x'] + dx, 'y': chegada['y'] + dy} for dx, dy in perto
                if f"{chegada['x'] + dx},{chegada['y'] + dy}" in vivas
                and f"{chegada['x'] + dx},{chegada['y'] + dy}" not in reservado]
    # AS DUAS ARANHAS MORTAS DO CAPIM. A Forgotten Adventures as DESENHA, de patas abertas, nas duas margens
    # da trilha que desce da torre; a planta antiga tinha as duas peças, mas soltas dentro do prédio. Lidas
    # casa a casa no desenho ampliado: o abdome de uma está em (28,9) e o da outra em (32,9). Ficam onde a
    # pintura as põe, e aí o botão direito tem o que examinar em cima de uma coisa que o jogador VÊ.
    ARANHAS_MORTAS = [[{'x': 28, 'y': 9}, {'x': 28, 'y': 10}], [{'x': 32, 'y': 9}, {'x': 32, 'y': 10}]]
    fixas = [{'variante': 'estatuaPalien', 'casas': [pontos['estatua']]},
             {'variante': 'placaCaveira', 'casas': vizinhas}]
    fixas += [{'variante': 'aranhaMorta', 'casas': cs} for cs in ARANHAS_MORTAS]
    # A LAREIRA ACESA DA CABANA e a PORTA CAÍDA DO GALPÃO: as duas coisas que a cena da FA declara por
    # ladrilho (`CottageFireplace` em 13,26 e `FallenDoor` em 29,4) e que não tinham objeto nosso. A lareira
    # vai na casa da própria chama — a luz de fogueira que a FA acende dentro do ladrilho dela —, que é o que
    # o jogador vê queimando; a porta vai na casa do ladrilho.
    fogo = next((l for l in mapa['luzes'] if l.get('tipo') == 'fogueira'), None)
    if fogo:
        fixas.append({'variante': 'lareira', 'casas': [dict(fogo['pos'])]})
    fixas.append({'variante': 'portaCaida', 'casas': [{'x': 29, 'y': 4}, {'x': 29, 'y': 5}]})
    # `vivas` foi medido ANTES de o cofre entrar, e o cofre barra: sem tirá-lo daqui, a conta de
    # "nada ficou ilhado" reprovaria toda peça fixa, porque a casa do cofre nunca mais é alcançada.
    posto = mobiliar(mapa, celulas, reservado, vivas - {movel}, MOBILIA, fixas)
    terreno = posto['terreno']
    mapa['terreno'] = terreno
    props = posto['props']
    if posto['sobraram']:
        print(f"  mobília: {sum(posto['sobraram'].values())} peça(s) não couberam — {posto['sobraram']}")
    print(f'  mobília: {len(props)} peça(s) postas em {len(MOBILIA)} prédio(s)')
    # a arca do dragão barra o passo e NÃO está em `props`: ela também é móvel para a conferência
    moveis = [movel] + [f"{q['x']},{q['y']}" for q in props + posto['foraDeProps']]

    provas(mapa, celulas, {**pontos, **objetos,
                           **{f'ninho {k}': v for k, v in ninhos.items()}}, moveis=moveis)

    caixa = lambda cs: {'x0': min(c['x'] for c in cs), 'y0': min(c['y'] for c in cs),
                        'x1': max(c['x'] for c in cs), 'y1': max(c['y'] for c in cs)}
    folhas = arestas_de_porta(mapa)
    print(f'  folhas: {len(folhas)} porta(s) da planta ganham folha (abrem e fecham no menu)')

    dados = {
        'chegada': pontos['chegada'],
        'grupo': mapa['grupo'],
        'saida': pontos['saida'],
        'estatua': pontos['estatua'],
        'portaDaTorre': pontos['portaDaTorre'],
        'reidoth': pontos['reidoth'],
        'torre': {**caixa(celulas['torre']), 'cx': meio('torre')['x'], 'cy': meio('torre')['y'], 'raio': 4},
        'ninhos': ninhos,
        'objetos': objetos,
        'zonas': {'matoLeste': {'x0': MATO['ramos5'][0][0], 'y0': MATO['ramos5'][0][1],
                                'x1': MATO['ramos5'][0][2], 'y1': MATO['ramos5'][0][3]},
                  'tecelagemSul': {'x0': MATO['ramos12'][0][0], 'y0': MATO['ramos12'][0][1],
                                   'x1': MATO['ramos12'][0][2], 'y1': MATO['ramos12'][0][3]}},
        'celulas': celulas,
        'predios': {n: caixa(cs) for n, cs in celulas.items() if cs},
        'pisos': {n: 'laje' for n, _s, _c, _k in predios},
        # `tipo: 'prop'` é o que o tabuleiro olha para desenhar a peça (`vista-topo.js pintarMoveis`). Neste
        # mapa, que é pintado, ele não desenha móvel nenhum — mas sem o campo a peça também não contaria em
        # conferência nenhuma, e deixaria de existir no dia em que alguém tirasse o fundo.
        'props': [{**q, 'tipo': 'prop'} for q in props],
        # TODA PORTA DA PLANTA GANHA FOLHA — ver `arestas_de_porta`. Sem ela, nenhuma porta da aldeia abre, e
        # a porta trancada do culto (que o capítulo fecha por aresta) não tinha aresta para fechar.
        'folhas': folhas,
    }

    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    cabecalho = (
        '// AS RUÍNAS DE ÁRVORE TROVÃO (Parte 4), sobre o battlemap da Forgotten Adventures.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-arvoretrovao-fa.py` — mude lá e rode de novo. A planta antiga (91x68,\n'
        '// desenhada à mão) está aposentada em `mapa-arvoretrovao.py`: 45% do chão dela cai fora do desenho.\n'
        '//\n'
        '// A luz: a cena da FA é de DIA (`globalLight` ligado, `darknessLevel 0`), então a grade nasce clara.\n'
        '// As três luzes são a lareira, a lanterna e a FUMAÇA VERDE DO DRAGÃO, que atravessa parede de\n'
        '// propósito (`walls: false` na cena deles) e marca o covil no anel de pedra.\n'
        '//\n'
        '// OS NOMES DOS PRÉDIOS SÃO CHUTE POSICIONAL, do sul para o norte. Só a torre é certa. Corrija em\n'
        '// `PREDIOS`, no gerador, e rode de novo: as provas cuidam do resto.\n'
        '//\n'
        '// A ARTE não entra no repositório nem na publicação (licença da FA).\n'
    )
    corpo = (
        'export const MAPA_ARVORE_TROVAO = {\n'
        '  terreno: [\n' + ''.join(f'    {um(l)},\n' for l in terreno) + '  ],\n'
        '  luz: [\n' + ''.join(f'    {um(l)},\n' for l in mapa['luz']) + '  ],\n'
        f'  luzes: {um(mapa["luzes"])},\n'
        '  paredes: {\n'
        + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in mapa['paredes'][lado]) + '    ],\n'
                  for lado in ('n', 'o'))
        + '  },\n'
        f'  tracos: {um(mapa["tracos"])},\n'
        + (f'  tracosTipo: {um(mapa["tracosTipo"])},\n' if 'tracosTipo' in mapa else '')
        + f'  sobreposicoes: {um(mapa["sobreposicoes"])},\n'
        + f'  fundo: {um(mapa["fundo"])},\n'
        '};\n\n'
        'export const ARVORE_TROVAO = ' + json.dumps(dados, ensure_ascii=False, indent=2) + ';\n'
    )
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)

    print(f'  escrito: {SAIDA}')
    print(f'  rocha (bolsao que ninguem alcanca): {pedra} casas | luz que andou: {andaram}')
    # INTEIRO x CASCA. A aldeia se divide em dois: as construções com TELHADO (as sete peças da camada de
    # frente, que são as sete que a FA desenhou com teto) e o resto, casca de alicerce quebrado. Só nas
    # inteiras "entrar" quer dizer alguma coisa — e as cinco com PORTA são todas delas. É o que decide onde
    # cabe um encontro fechado, uma porta trancada ou um telhado que some quando o grupo entra.
    teto_de = {}
    for o in sobreposicoes:
        if 'telhado' not in o['id']:
            continue
        for nome, cs in celulas.items():
            if any(o['x'] <= c['x'] < o['x'] + o['w'] and o['y'] <= c['y'] < o['y'] + o['h'] for c in cs):
                teto_de.setdefault(nome, o['id'])
    porta_de = {nome: len(portas_de(mapa, cs)) for nome, cs in celulas.items() if cs}
    inteiras = [n for n in celulas if n in teto_de]
    print(f'  construções: {len(inteiras)} INTEIRAS (com telhado) e {len(celulas) - len(inteiras)} cascas abertas')
    print('  prédios (casas | portas | telhado | certeza):')
    for nome, s, _c, certo in predios:
        print(f'    {nome:12} {len(celulas[nome]):3} casas  {porta_de.get(nome, 0)} porta(s)  '
              f'{"telhado" if nome in teto_de else "casca  "}  semente {s}  {"certa" if certo else "A CONFERIR"}')
    print(f'  sem planta que o desenho dê (viraram área de rua): {", ".join(SEM_PREDIO)}')
    print('  ninhos: ' + ', '.join(f'{k}={len(v)}' for k, v in ninhos.items()))


if __name__ == '__main__':
    main()
