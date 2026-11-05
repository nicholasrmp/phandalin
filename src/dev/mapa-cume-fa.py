"""GERA o mapa do Cume da Wyvern (`game/cume.js`) sobre o battlemap da Forgotten Adventures.

    python src/dev/importar-foundry.py mapas/_cenas/wyvern-tor-18x24.json <imagem> \
        --editor src/dev/_tmp/cume-fa.json
    python src/dev/mapa-cume-fa.py

O QUE MUDOU DE VERDADE, e não é só coordenada: a planta antiga (30x21, `mapa-cume.py`) era um desfiladeiro com
o acampamento orc DO LADO DE FORA, num platô de 220 casas elevadas, e a caverna era um cômodo de 7x5 no canto.
A da FA é a caverna, com o acampamento DENTRO dela — fogueira, palha e caixote desenhados no chão. É mais perto
do livro, que fala de "uma caverna no tor", e o platô era elaboração nossa. O platô, as carroças e a pedra do
vigia saem; o vigia passa a ficar na boca.

A GEOMETRIA, medida rodando o motor (nada de olhômetro):

    caverna   inundação de 4 direções a partir de (4,8), com a BOCA fechada: 76 casas. Sem fechar a boca a
              inundação sai e pega o mapa inteiro, que é o que se espera de uma caverna aberta.
    boca      não é uma casa só: fechar (9,4) deixa passar por (9,3)->(10,3)->(10,4). As duas juntas fecham.
              Por isso `entrada` é (9,4) e o capítulo usa `FORA_DA_BOCA` e `DENTRO_DA_BOCA` nomeados, em vez de
              contar ±1 a partir dela como fazia na planta antiga — lá a boca era vertical, aqui é de lado.
    fogueira  o anel de pedras com cinza, em (5,7). A cena do Foundry confirma: há uma luz `torch` em (5,3 , 7,4).
    palha     as manchas de palha em x 3..7, y 5..6, que é onde os orcs dormem.
    caixote   a caixa de madeira em (5,11).

O TERRENO: dentro é chão de caverna e NO BREU (a grade de luz), fora é terra à luz do dia. O Foundry não tem
camada de chão, então isto vem daqui, e não do import.

A ARTE não entra no repositório nem na publicação (licença da FA). Sem o arquivo em `public/mapas/fa/`, a cena
abre com o ladrilho do glifo.
"""
import json
import os
import pathlib
import subprocess
import sys

Image = None
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENTRADA = os.path.join(RAIZ, 'src', 'dev', '_tmp', 'cume-fa.json')
SAIDA = os.path.join(RAIZ, 'src', 'game', 'cume.js')

BOCA = [(9, 4), (10, 4)]          # as duas casas que, juntas, fecham a caverna
DENTRO_DE = (4, 8)                # semente da inundação, no meio do acampamento
ENTRADA_P = (9, 4)
FORA_DA_BOCA = (11, 4)            # onde o vigia fica e de onde os orcs alarmados encaram o grupo
DENTRO_DA_BOCA = (8, 5)
FOGUEIRA = (5, 7)
CAIXOTE = (5, 11)
PALHA = [(x, y) for y in (5, 6) for x in range(3, 8)]
# o elenco, dentro da caverna: o chefe no fundo, dois acordados perto da boca, um de costas junto do fogo,
# três dormindo na palha e o ogro Gog num canto. Tudo conferido contra o chão pelas provas.
POSTOS = {
    'brughor': (3, 8),
    'orcs': [(7, 5), (8, 6), (6, 8), (4, 5), (5, 5), (6, 5)],   # A, B acordados; C junto do fogo; D, E, F na palha
    'dormem': [False, False, False, True, True, True],
    'gog': (4, 10),
}
SAIDA_CASAS = [(10, 23), (11, 23), (12, 23)]
GRUPO = [(11, 21), (12, 21), (11, 22), (12, 22)]


def motor(programa, extra=None):
    base = pathlib.Path(RAIZ).as_uri()
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module',
                        '-e', programa.replace('@BASE@', base)],
                       cwd=RAIZ, capture_output=True, text=True, env={**os.environ, **(extra or {})})
    if r.returncode:
        sys.exit(f'o motor recusou:\n{r.stderr.strip()}')
    return json.loads(r.stdout.strip().splitlines()[-1])


def interior(base):
    """As casas de dentro da caverna, pedidas ao motor: inundação de 4 direções com a boca fechada."""
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const B = new Set(JSON.parse(process.env.BOCA));
const [sx, sy] = JSON.parse(process.env.SEMENTE);
const v = new Set([`${sx},${sy}`]); const q = [[sx, sy]];
while (q.length) { const [x, y] = q.pop();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
    if (nx < 0 || ny < 0 || nx >= f.w || ny >= f.h || v.has(k) || B.has(k)) continue;
    if (f.blocksMove(nx, ny) || !f.passa(x, y, nx, ny)) continue;
    v.add(k); q.push([nx, ny]); } }
console.log(JSON.stringify([...v]));
'''
    casas = motor(programa, {'MAPA': json.dumps(base), 'SEMENTE': json.dumps(DENTRO_DE),
                             'BOCA': json.dumps([f'{x},{y}' for x, y in BOCA])})
    return {tuple(int(v) for v in k.split(',')) for k in casas} | set(BOCA)


def provas(mapa):
    """Confere no MOTOR que cada ponto do capítulo está de pé. Falha alto se não."""
    pontos = {
        'entrada': ENTRADA_P, 'fora da boca': FORA_DA_BOCA, 'dentro da boca': DENTRO_DA_BOCA,
        'brughor': POSTOS['brughor'], 'gog': POSTOS['gog'],
        **{f'orc {i}': p for i, p in enumerate(POSTOS['orcs'])},
        **{f'saida {i}': p for i, p in enumerate(SAIDA_CASAS)},
        **{f'heroi {i}': p for i, p in enumerate(GRUPO)},
    }
    programa = '''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const f = montarCampo(JSON.parse(process.env.MAPA));
const pontos = JSON.parse(process.env.PONTOS);
const dentro = new Set(JSON.parse(process.env.DENTRO));
const erros = [];
for (const [nome, [x, y]] of Object.entries(pontos)) {
  if (f.blocksMove(x, y)) erros.push(`${nome} (${x},${y}) caiu em casa bloqueada`);
}
// o grupo chega a tudo: senao a cena trava com alguem preso
const alc = f.reachable({ x: pontos['heroi 0'][0], y: pontos['heroi 0'][1] }, 6000);
for (const [nome, [x, y]] of Object.entries(pontos)) {
  if (!f.blocksMove(x, y) && !alc.has(`${x},${y}`)) erros.push(`${nome} (${x},${y}) nao se alcanca do grupo`);
}
// o fogo acende, o caixote barra e a caverna esta no breu NA GRADE
if (f.surfaceAt(...JSON.parse(process.env.CAIXOTE)) !== 'bau') erros.push('o caixote nao tem a superficie bau');
for (const k of dentro) { const [x, y] = k.split(',').map(Number);
  if (!f.blocksMove(x, y) && f.luz && f.luz[y * f.w + x] !== 0) { erros.push(`a caverna nao esta no breu em (${x},${y})`); break; } }
// ... e a FOGUEIRA poe a caverna em penumbra, que e a decisao do capitulo ("a caverna tem penumbra, nao breu").
// Medido, e nao chutado: TODO POSTO do bando tem de estar aceso, e so UM canto fica no escuro -- o nicho (5,13),
// atras da quina, que a reta da luz nao enxerga. Se aparecer um segundo, a fogueira encolheu e a cena mudou.
const { nivelDeLuz } = await import('@BASE@/src/rules/luz.js');
const fontes = (f.luzes ?? []).map((l) => ({ ...l }));
if (!fontes.length) erros.push('a caverna ficou sem a luz da fogueira');
const escuras = [];
for (const k of dentro) { const [x, y] = k.split(',').map(Number);
  if (!f.blocksMove(x, y) && nivelDeLuz(f, x, y, fontes) === 0) escuras.push(k); }
if (escuras.join(' ') !== '5,13') erros.push(`a fogueira deixa ${escuras.length} casa(s) da caverna no breu: ${escuras.join(' ')} (esperado so o nicho 5,13)`);
for (const [nome, [x, y]] of Object.entries(pontos)) {
  if (nome === 'saida 0' || nome === 'saida 1' || nome.startsWith('heroi')) continue;   // esses ficam fora da caverna
  if (dentro.has(`${x},${y}`) && nivelDeLuz(f, x, y, fontes) === 0) erros.push(`${nome} (${x},${y}) fica no breu: a fogueira nao o alcanca`);
}
console.log(JSON.stringify(erros));
'''
    erros = motor(programa, {'MAPA': json.dumps(mapa), 'PONTOS': json.dumps(pontos),
                             'CAIXOTE': json.dumps(list(CAIXOTE)),
                             'DENTRO': json.dumps([f'{x},{y}' for x, y in sorted(interior_cache)])})
    if erros:
        sys.exit('OS PONTOS NAO BATEM COM O MAPA:\n  - ' + '\n  - '.join(erros))
    print(f'  provas: {len(pontos)} pontos, o breu da caverna e o caixote conferidos no motor')


def main():
    global interior_cache
    base = json.load(open(ENTRADA, encoding='utf-8'))
    h = len(base['terreno'])
    w = len(base['terreno'][0])
    interior_cache = interior(base)

    # --- o terreno: dentro chão de caverna, fora terra; o que o import deu por rocha continua rocha
    t = [list(l) for l in base['terreno']]
    for y in range(h):
        for x in range(w):
            if t[y][x] == 'R':
                continue
            t[y][x] = '_' if (x, y) in interior_cache else ':'
    for x, y in PALHA:
        if (x, y) in interior_cache and (x, y) != FOGUEIRA:
            t[y][x] = 'z'
    t[FOGUEIRA[1]][FOGUEIRA[0]] = 'F'
    t[CAIXOTE[1]][CAIXOTE[0]] = 'K'
    terreno = [''.join(l) for l in t]

    # --- a luz: a caverna no breu NA GRADE, o lado de fora à luz do dia, e a FOGUEIRA acendendo a caverna
    #
    # A grade é o que sobra quando o fogo apaga, e mil metros de rocha não têm luz do dia: breu. Quem acende é a
    # chama, como na Mansão e na Onda Eco. O capítulo decidiu, medindo 200 a 400 lutas, que "a caverna tem
    # penumbra (a fogueira do fundo), não breu" (`capitulo4-cume.js`) — e a narração diz "a luz baixa de uma
    # fogueira no fundo mostra o bando". A planta nova tinha deixado a caverna no breu SEM fogueira nenhuma, o
    # que contradizia as duas coisas. Então: `claro: 0` (só a casa da própria chama fica clara) e `penumbra: 40`,
    # que é a distância MEDIDA da fogueira até a casa mais longe da caverna — luz baixa que chega ao canto, e
    # não um holofote. Apagar a fogueira (`game/fogo.js`) joga a caverna no breu de verdade, e aí a visão no
    # escuro dos orcs vale contra o grupo.
    luz = []
    for y in range(h):
        luz.append(''.join('0' if (x, y) in interior_cache else '2' for x in range(w)))
    alcance = max(max(abs(x - FOGUEIRA[0]), abs(y - FOGUEIRA[1])) for (x, y) in interior_cache) * 5
    luzes = [{'pos': {'x': FOGUEIRA[0], 'y': FOGUEIRA[1]}, 'claro': 0, 'penumbra': alcance, 'tipo': 'fogueira'}]

    mapa = {
        'terreno': terreno,
        'luz': luz,
        'luzes': luzes,
        'paredes': base['paredes'],
        'tracos': base['tracos'],
        **({'tracosTipo': base['tracosTipo']} if base.get('tracosTipo') else {}),
        'fundo': {'nome': 'cume.jpg', 'url': '/mapas/fa/cume.jpg', 'escala': 100,
                  'x0': 0, 'y0': 0, 'giro': 0, 'opacidade': 1},
    }
    provas(mapa)

    dentro = sorted(interior_cache)
    pontos = {
        'entrada': {'x': ENTRADA_P[0], 'y': ENTRADA_P[1]},
        'foraDaBoca': {'x': FORA_DA_BOCA[0], 'y': FORA_DA_BOCA[1]},
        'dentroDaBoca': {'x': DENTRO_DA_BOCA[0], 'y': DENTRO_DA_BOCA[1]},
        'vigia': {'x': FORA_DA_BOCA[0], 'y': FORA_DA_BOCA[1]},
        'bau': {'x': CAIXOTE[0], 'y': CAIXOTE[1]},
        'fogueira': {'x': FOGUEIRA[0], 'y': FOGUEIRA[1]},
        'caverna': {'x0': min(p[0] for p in dentro), 'y0': min(p[1] for p in dentro),
                    'x1': max(p[0] for p in dentro), 'y1': max(p[1] for p in dentro)},
        'casasDaCaverna': [{'x': x, 'y': y} for x, y in dentro],
        'brughor': {'x': POSTOS['brughor'][0], 'y': POSTOS['brughor'][1]},
        'gog': {'x': POSTOS['gog'][0], 'y': POSTOS['gog'][1]},
        'orcs': [{'x': x, 'y': y, 'dorme': d} for (x, y), d in zip(POSTOS['orcs'], POSTOS['dormem'])],
        'grupo': [{'x': x, 'y': y} for x, y in GRUPO],
        'saida': [{'x': x, 'y': y} for x, y in SAIDA_CASAS],
    }
    um = lambda v: json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    cabecalho = (
        '// O CUME DA WYVERN (Parte 3): o acampamento orc DENTRO da caverna, sobre o battlemap da Forgotten\n'
        '// Adventures.\n'
        '//\n'
        '// GERADO por `src/dev/mapa-cume-fa.py` — mude lá e rode de novo. A planta antiga (30x21, desfiladeiro\n'
        '// com platô e o acampamento do lado de fora) está aposentada em `mapa-cume.py`: o livro fala de uma\n'
        '// caverna no tor, e o platô era elaboração nossa.\n'
        '//\n'
        '// Glifos: _ chão de caverna · : terra · R rocha · z palha · F fogueira · K caixote. Quem barra passo é\n'
        '// a PAREDE (`tracos`), não o glifo. A caverna está no breu (`luz`), o lado de fora à luz do dia.\n'
        '//\n'
        '// A ARTE não entra no repositório nem na publicação (licença da FA).\n'
    )
    corpo = (
        'export const MAPA_CUME = {\n'
        '  terreno: [\n' + ''.join(f'    {um(l)},\n' for l in terreno) + '  ],\n'
        '  luz: [\n' + ''.join(f'    {um(l)},\n' for l in luz) + '  ],\n'
        '  luzes: [\n' + ''.join(f'    {um(l)},\n' for l in luzes) + '  ],\n'
        '  paredes: {\n'
        + ''.join(f'    {lado}: [\n' + ''.join(f'      {um(l)},\n' for l in mapa['paredes'][lado]) + '    ],\n'
                  for lado in ('n', 'o'))
        + '  },\n'
        '  tracos: [\n' + ''.join(f'    {um(t)},\n' for t in mapa['tracos']) + '  ],\n'
        + (f'  tracosTipo: {um(mapa["tracosTipo"])},\n' if 'tracosTipo' in mapa else '')
        + f'  fundo: {um(mapa["fundo"])},\n'
        '};\n\n'
        'export const CUME = {\n'
        + ''.join(f'  {c}: {um(pontos[c])},\n' for c in pontos)
        + '};\n'
    )
    with open(SAIDA, 'w', encoding='utf-8', newline='\n') as f:
        f.write(cabecalho + '\n' + corpo)
    print('\n'.join(terreno))
    print(f'  caverna: {len(dentro)} casas; escrito: {SAIDA}')


interior_cache = set()
if __name__ == '__main__':
    main()
