"""Importa uma CENA DO FOUNDRY VTT e devolve o mapa do nosso jogo.

    python src/dev/importar-foundry.py <cena.json> <imagem> [--nome esconderijo-fa.webp]

A entrada é um arquivo de `packs/_source/` de um módulo do Foundry — JSON puro, com paredes, luzes, ladrilhos e
sons. Os da Forgotten Adventures estão publicados em
`github.com/Forgotten-Adventures/FA_Battlemaps/tree/main/packs/_source/maps` (303 cenas).

A saída é o bloco pronto para colar em `game/encounter.js`. **Não é preciso instalar o Foundry**: a instalação
que o post ensina é colar o manifesto no gerenciador de módulos DELE; aqui se lê o mesmo dado direto.

AS CONTAS DA TRADUÇÃO

  grade       `grid.size` é px da imagem por casa, e `grid.distance` os pés que a casa vale (5, como o SRD).
  origem      o Foundry ENVOLVE a cena numa moldura: o canto da imagem não é (0,0), e sim
              `ceil(padding * largura / grid) * grid`. No Cragmaw dá (500, 300) — conferido medindo: naquele
              deslocamento 99,2% dos pontos de parede caem em pixel escuro do desenho.
  parede      vira `tracos`, a nossa polilinha em casas com fração — que é o mesmo conceito: segmento livre, não
              aresta de grade. Segmentos que se tocam viram uma linha só. A aresta de casa que a REGRA usa sai
              daí sozinha (`mapa-editor.js arestasDosTracos`).
  luz         `bright` e `dim` do Foundry são raios em PÉS, contados do centro; o nosso `claro` é o mesmo
              `bright`, e `penumbra` é o que sobra (`dim - bright`), porque o nosso motor soma os dois.
  chão        O FOUNDRY NÃO TEM CAMADA DE CHÃO: quem decide onde se pisa é só a parede. Então aqui o terreno
              nasce todo de chão de caverna e só o VAZIO PRETO de fora do desenho vira rocha — e isso se lê da
              imagem, não do JSON. É a tradução fiel; afinar o chão depois é trabalho da ferramenta 5 do editor.

O QUE NÃO ATRAVESSA, e o script diz quanto de cada um ficou para trás:

  parede só de visão   `move: 0` com `sight: 20` (o "Ethereal" do Foundry). A nossa aresta barra as duas coisas
                       ou nenhuma, então essas somem. Precisariam de um código novo em `core/grid.js`.
  ladrilho de overlay  a ponte que cede, o baú aberto, a enxurrada, o brilho pintado de cada fogueira. Nós temos
                       onde pendurar isso (`frente` e `interativos`), mas não um ladrilho comutável.
  som ambiente         não temos som por posição.
  região               o `Region` do Foundry v12 (restringe passo sem parede). O nosso equivalente é pintar o
                       terreno por área, ferramenta 5.

LICENÇA. Isto lê DADO (coordenada de parede, raio de luz), não arte. A arte do battlemap continua fora do
repositório: a licença da Forgotten Adventures proíbe embutir a arte deles em video game, e o `.gitignore` cuida
disso. Ver `encaixar-fa.py`.
"""
import json
import math
import os
import sys
from collections import defaultdict

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# O vazio de fora do desenho é preto CRAVADO (brilho 0,0 medido), e a caverna é fraca mas nunca nula. Medido no
# Cragmaw sem fogueira acesa, a fração de pixels acima de 12 por casa: câmara do covil 76,5%, câmara de Klarg
# 86,4%, o túnel mais escuro do meio 76,7% — contra 0,0% no preto de fora. Em 18 o túnel caía para 26% e era
# lido como rocha; em 12 a separação é limpa com folga dos dois lados.
VAZIO = 12
BLOQUEIA = 20       # CONST.WALL_MOVEMENT_TYPES.NORMAL

# A MESMA ARTE COM OUTRO NOME. O módulo do Foundry batiza as manchas de fogo aceso de `Light00` e `Light01` e
# as baixa da CDN; o pacote de imagens do site traz as duas, com o nome do cômodo. Conferido: `LightDen` tem
# 1600x1200 = 8x6 casas e a cena põe a `Light00` em 8x6; `LightCave` tem 2000x2000 = 10x10 e a `Light01` vai em
# 10x10. São as mesmas peças, e com isto elas deixam de faltar.
ALIAS = {'Light00': 'LightDen', 'Light01': 'LightCave'}


def origem(cena):
    """O canto da imagem dentro da moldura que o Foundry põe em volta da cena."""
    g = cena['grid']['size']
    p = cena.get('padding', 0)
    return math.ceil(p * cena['width'] / g) * g, math.ceil(p * cena['height'] / g) * g


def correntes(segmentos):
    """Junta segmentos que se tocam numa polilinha só. 371 paredes soltas viram algumas dezenas de linhas."""
    vizinhos = defaultdict(list)
    for i, (a, b) in enumerate(segmentos):
        vizinhos[a].append(i)
        vizinhos[b].append(i)
    usado = [False] * len(segmentos)
    saida = []
    for i in range(len(segmentos)):
        if usado[i]:
            continue
        usado[i] = True
        linha = list(segmentos[i])
        # cresce pelas duas pontas enquanto houver exatamente um segmento novo encostado nela
        for ponta in (0, 1):
            while True:
                p = linha[0] if ponta == 0 else linha[-1]
                seguintes = [j for j in vizinhos[p] if not usado[j]]
                if len(seguintes) != 1:
                    break
                j = seguintes[0]
                usado[j] = True
                a, b = segmentos[j]
                outro = b if a == p else a
                if ponta == 0:
                    linha.insert(0, outro)
                else:
                    linha.append(outro)
        saida.append(linha)
    return saida


def tipoDaLuz(cfg):
    anim = (cfg.get('animation') or {}).get('type')
    claro = cfg.get('bright', 0)
    if anim in ('torch', 'flame', 'fire'):
        return 'fogueira' if claro >= 15 else 'tocha'
    return 'tocha' if claro >= 10 else 'vela'


def main():
    caminho = sys.argv[1]
    imagem = sys.argv[2]
    nome = sys.argv[sys.argv.index('--nome') + 1] if '--nome' in sys.argv else os.path.basename(imagem)
    cena = json.load(open(caminho, encoding='utf-8'))
    g = cena['grid']['size']
    ox, oy = origem(cena)
    W = cena['width'] // g
    H = cena['height'] // g
    casa = lambda sx, sy: ((sx - ox) / g, (sy - oy) / g)

    rel = sys.stderr
    print(f'cena "{cena["name"]}"  {W}x{H} casas  grade {g} px = {cena["grid"]["distance"]} '
          f'{cena["grid"]["units"]}  origem ({ox}, {oy})', file=rel)

    # ---- o chão: só o vazio de fora vira rocha (o Foundry não tem camada de chão) ----
    im = Image.open(os.path.join(RAIZ, imagem)).convert('RGB')
    if (im.width, im.height) != (cena['width'], cena['height']):
        k = im.width / cena['width']
        print(f'  atenção: a imagem é {im.width}x{im.height} e a cena {cena["width"]}x{cena["height"]} '
              f'(fator {k:.3f}) — as casas seguem a CENA', file=rel)
    else:
        k = 1.0
    if '--chao-pela-cor' in sys.argv:
        a = np.asarray(im).astype(np.float32).mean(axis=2)
        terreno = []
        for y in range(H):
            linha = ''
            for x in range(W):
                bloco = a[int(y * g * k):int((y + 1) * g * k), int(x * g * k):int((x + 1) * g * k)]
                linha += 'R' if bloco.size and (bloco > VAZIO).mean() < 0.5 else '_'
            terreno.append(linha)
        rocha = sum(l.count('R') for l in terreno)
        print(f'  chão pela COR da imagem: {W * H - rocha} de caverna, {rocha} de rocha', file=rel)
    else:
        # A TRADUÇÃO FIEL: tudo chão, e quem barra é a parede. Depois o `derivar-paredes.mjs` semeia nas luzes e
        # vira rocha o que a parede não deixa alcançar — então o contorno do andável é a LINHA da parede, e não
        # o quadrado mais próximo dela. Com `--chao-pela-cor` o recorte vem do preto da imagem, como antes.
        terreno = ['_' * W for _ in range(H)]
        print('  chão: tudo caverna; quem recorta é a parede (use --chao-pela-cor para o recorte pela imagem)', file=rel)

    # ---- as paredes ----
    paredes = cena.get('walls', [])
    passam = [w for w in paredes if w.get('move') == BLOQUEIA]
    soVisao = [w for w in paredes if w.get('move') != BLOQUEIA]
    portas = [w for w in paredes if w.get('door')]
    segs = []
    for w in passam:
        x0, y0, x1, y1 = w['c']
        a0 = tuple(round(v, 3) for v in casa(x0, y0))
        a1 = tuple(round(v, 3) for v in casa(x1, y1))
        if a0 != a1:
            segs.append((a0, a1))
    linhas = correntes(segs)
    print(f'  paredes: {len(paredes)} na cena, {len(passam)} barram passo e viraram '
          f'{len(linhas)} traço(s); {len(soVisao)} só de visão FICARAM DE FORA; {len(portas)} porta(s)', file=rel)

    # ---- as luzes ----
    luzes = []
    fora = 0
    for l in cena.get('lights', []):
        if l.get('hidden'):
            continue
        cfg = l.get('config', {})
        cx, cy = casa(l['x'], l['y'])
        # luz na MOLDURA, fora da imagem: o Foundry deixa acender ali (a cachoeira do leste do Cragmaw), o nosso
        # mapa não tem casa para ela. Melhor dizer que ficou de fora do que grudá-la na borda calada.
        if not (0 <= cx < W and 0 <= cy < H):
            fora += 1
            continue
        luzes.append({'x': int(cx), 'y': int(cy), 'claro': round(cfg.get('bright', 0)),
                      'penumbra': round(cfg.get('dim', 0) - cfg.get('bright', 0)), 'tipo': tipoDaLuz(cfg)})
    print(f'  luzes: {len(luzes)}' + (f'; {fora} fora da imagem, na moldura — ficaram de fora' if fora else ''), file=rel)

    # ---- os ladrilhos comutáveis viram SOBREPOSIÇÕES ----
    #
    # Nem todo ladrilho é arte: metade deles é o INTERRUPTOR — um `Transparent.webp` de um terço de casa, ou um
    # `.svg` escondido, com `trigger: ["dblclick"]`. Esses não se traduzem: aqui quem dispara é o objeto
    # interagível, que é ação do jogador e não controle de mestre. Também ficam de fora o `.webm` (prop em
    # vídeo) e o que está na moldura, fora do mapa — a UI do "Control Scroll" da FA mora ali.
    sobre = []
    pulados = {'interruptor': 0, 'vídeo': 0, 'na moldura': 0}
    interruptores = []
    for t in cena.get('tiles', []):
        src = (t.get('texture') or {}).get('src') or ''
        arq = src.split('/')[-1]
        base, _, ext = arq.rpartition('.')
        cx, cy = casa(t['x'], t['y'])
        if ext.lower() in ('svg',) or base.lower() == 'transparent':
            pulados['interruptor'] += 1
            if 0 <= cx < W and 0 <= cy < H:
                interruptores.append((int(cx), int(cy), base))
            continue
        if ext.lower() in ('webm', 'mp4'):
            pulados['vídeo'] += 1
            continue
        if cx >= W or cy >= H or cx + t['width'] / g <= 0 or cy + t['height'] / g <= 0:
            pulados['na moldura'] += 1
            continue
        etiquetas = ((t.get('flags') or {}).get('tagger') or {}).get('tags') or []
        # o nome vem da etiqueta do Tagger quando ela diz alguma coisa; etiqueta que é só um número é ordem de
        # quadro (a enxurrada vai de "0" a "6"), e aí o nome do arquivo já serve e já é único
        ident = next((e for e in etiquetas if not e.isdigit()), None) or base
        while any(o['id'] == ident for o in sobre):          # dois destaques dividiam a etiqueta "highlight"
            ident = f'{ident}2' if not ident[-1].isdigit() else f'{ident[:-1]}{int(ident[-1]) + 1}'
        arquivo = ALIAS.get(base, base) + '.webp'
        sobre.append({
            'id': ident, 'url': f'/mapas/fa/{arquivo}',
            'x': round(cx, 2), 'y': round(cy, 2),
            'w': round(t['width'] / g, 2), 'h': round(t['height'] / g, 2),
            # TUDO NASCE APAGADO. No Foundry o ladrilho está "visível" e quem decide é a ação do gatilho, que
            # não se traduz; e a pintura de base já mostra o estado inicial — a ponte inteira, o baú fechado, a
            # fogueira apagada. Acender é trabalho do roteiro da cena, que é onde a decisão cabe.
            'ligada': False,
            'frente': 'betterroofs' in (t.get('flags') or {}),
            'arquivo': arquivo,
        })
    faltam = [o['arquivo'] for o in sobre if not os.path.exists(os.path.join(RAIZ, 'public', 'mapas', 'fa', o['arquivo']))]
    print(f'  sobreposições: {len(sobre)} de {len(cena.get("tiles", []))} ladrilhos'
          + ''.join(f'; {n} {k}' for k, n in pulados.items() if n), file=rel)
    if faltam:
        print(f'  ARTE QUE NÃO TEMOS ({len(faltam)} de {len(sobre)}): ' + ', '.join(sorted(set(faltam)))
              + '\n    (baixa pelo módulo do Foundry, e a premium pede login — a peça fica no mapa e não desenha)', file=rel)
    for o in sobre:
        del o['arquivo']

    if interruptores:
        # Onde o Foundry põe o duplo clique do mestre é onde a nossa cena deve pôr um objeto interagível
        # (`interativos`, ferramenta 9), que é a mesma ideia virada para o jogador: ele chega perto e mexe.
        print('  interruptores do Foundry, nas casas: '
              + ', '.join(f'{x},{y} ({n})' for x, y, n in sorted(set(interruptores))), file=rel)
        print('    (é ali que vai o objeto interagível da cena, e o `aoInteragir` chama '
              '`enc.field.alternarSobreposicao(id, true)`)', file=rel)
    for t in ('sounds', 'regions', 'notes', 'drawings'):
        n = len(cena.get(t) or [])
        if n:
            print(f'  {t}: {n} — não atravessam (ver o cabeçalho)', file=rel)

    # ---- o JSON que o `/editor.html` importa (como faz o `importar-roll20.mjs`) ----
    if '--editor' in sys.argv:
        destino = sys.argv[sys.argv.index('--editor') + 1]
        vazia = ['.' * W for _ in range(H)]
        # quatro pontos de partida na primeira casa de chão que aparecer, para o mapa abrir são no editor
        livres = [(x, y) for y in range(H) for x in range(W) if terreno[y][x] == '_'][:4]
        mapa = {
            'terreno': terreno, 'paredes': {'n': list(vazia), 'o': list(vazia)},
            'objetos': [], 'salas': {}, 'folhas': [], 'vaoUnido': [], 'grades': [],
            'tracos': [[list(p) for p in linha] for linha in linhas],
            'luzes': [{'pos': {'x': l['x'], 'y': l['y']}, 'claro': l['claro'],
                       'penumbra': l['penumbra'], 'tipo': l['tipo']} for l in luzes],
            'luz': 'escuro',
            **({'sobreposicoes': sobre} if sobre else {}),
            'fundo': {'nome': nome, 'url': f'/mapas/{nome}', 'escala': g, 'x0': 0, 'y0': 0,
                      'giro': 0, 'opacidade': 1},
            'grupo': [{'x': x, 'y': y} for x, y in livres] or [{'x': 0, 'y': 0}],
            'olhar': {'dx': 0, 'dy': 1},
        }
        json.dump(mapa, open(destino, 'w', encoding='utf-8'))
        # A ARESTA DE CASA (o que barra movimento) e o passe de bolsão são trabalho do MOTOR, não deste script:
        # quem sabe derivar aresta de traço é `mapa-editor.js`, e reimplementar aquilo aqui seria uma segunda
        # versão para divergir da primeira.
        import subprocess
        r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs',
                            'src/dev/derivar-paredes.mjs', os.path.abspath(destino)],
                           cwd=RAIZ, capture_output=True, text=True)
        print('  ' + (r.stdout.strip() if not r.returncode else
                      f'a camada de regra NÃO foi derivada:\n{r.stderr.strip()}'), file=rel)
        print(f'  escrito: {destino} — abra o /editor.html e use "Importar JSON"', file=rel)
        return

    # ---- o bloco para colar ----
    print('terreno: [')
    for l in terreno:
        print(f"  '{l}',")
    print('],\n')
    print(f"fundo: {{ nome: '{nome}', url: '/mapas/{nome}', escala: {g}, x0: 0, y0: 0, giro: 0, opacidade: 1 }},\n")
    print('tracos: [')
    for pts in linhas:
        print('  [' + ', '.join(f'[{x}, {y}]' for x, y in pts) + '],')
    print('],\n')
    if sobre:
        print('sobreposicoes: [')
        for o in sobre:
            extra = (", ligada: true" if o['ligada'] else '') + (", frente: true" if o['frente'] else '')
            print(f"  {{ id: '{o['id']}', url: '{o['url']}', x: {o['x']}, y: {o['y']}, "
                  f"w: {o['w']}, h: {o['h']}{extra} }},")
        print('],\n')
    print('luzes: [')
    for l in luzes:
        print(f"  {{ pos: {{ x: {l['x']}, y: {l['y']} }}, claro: {l['claro']}, "
              f"penumbra: {l['penumbra']}, tipo: '{l['tipo']}' }},")
    print('],')


if __name__ == '__main__':
    main()
