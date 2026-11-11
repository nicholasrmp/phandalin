# -*- coding: utf-8 -*-
"""O RETRATO DE UMA CENA: a nossa regra desenhada por cima da pintura dela. Rode com:

    python src/dev/retrato-da-cena.py [cena ...]        (sem argumento: todas as que têm `fundo`)

Sai um PNG por cena em `src/dev/_retratos/`, com tudo o que o jogo sabe e o desenho não mostra:

    AMARELO       parede de aresta (`paredes.n` / `paredes.o`) — é ela que barra passo e visão
    VERDE         porta (aberta ou fechada); CIANO arco, LARANJA seteira, ROXO janela/etérea
    VERMELHO      casa que o jogo BLOQUEIA (rocha, maciço, móvel que barra)
    AZUL          objeto desenhado no chão que o menu enxerga (baú, mantimentos, barris, leito…)
    CÍRCULO       cada luz do mapa, no raio dela: amarelo claro o `claro`, alaranjado a `penumbra`
    LOSANGO       criatura que a cena põe no tabuleiro
    ESTRELA       peça de mobília própria (`objetos` tipo prop)

É o `prova-fundo.py` levado adiante: aquele responde "o enquadramento bate?" e pede escala e origem na mão;
este lê o `fundo` que a própria cena declara, não pergunta nada, e responde "como ESTÁ esta cena hoje?" —
parede, porta, luz, objeto e bando, de uma olhada. Serve para mandar a figura a quem perguntou, e para ver de
relance o que o `conferir-paredes` e o `conferir-cena` só dizem em texto.

A ARTE DA FA NÃO ENTRA NO REPOSITÓRIO. Os retratos saem em `src/dev/_retratos/`, que o `.gitignore` cobre, e
cena sem a arte no disco é desenhada sobre fundo liso: a regra aparece igual.
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SAIDA = os.path.join(RAIZ, 'src', 'dev', '_retratos')
PX = 28                      # px por casa no retrato

PROGRAMA = r'''
const { montarCampo } = await import('@BASE@/src/game/campo.js');
const { mapaDo, buildFoes } = await import('@BASE@/src/game/encounter.js');
const { ARESTA, footprintOf } = await import('@BASE@/src/core/grid.js');
const OBJETO = new Set(['bau','mantimentos','barris','leito','fogueira','estalagmite','entulho','palha',
  'prop','propBaixo','pocoVelho','altar','tocaia','sarcofago','bigorna','tear']);
const fora = {};
for (const cena of JSON.parse(process.env.CENAS)) {
  let m; try { m = mapaDo(cena); } catch { continue; }
  if (!m?.terreno) continue;
  const f = montarCampo(m);
  const bloqueia = []; const objetos = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    if (f.blocksMove(x, y)) bloqueia.push([x, y]);
    if (OBJETO.has(f.surfaceAt(x, y))) objetos.push([x, y]);
  }
  const arestas = [];
  for (let y = 0; y < f.h; y += 1) for (let x = 0; x < f.w; x += 1) {
    const i = y * f.w + x;
    for (const [lado, arr] of [['N', f.paredeN], ['O', f.paredeO]]) {
      const c = arr[i];
      if (c && c !== ARESTA.aberta) arestas.push([x, y, lado, c]);
      else if (c === ARESTA.aberta) arestas.push([x, y, lado, ARESTA.aberta]);
    }
  }
  let bando = [];
  try { bando = (buildFoes(cena) ?? []).map((c) => ({ x: c.pos.x, y: c.pos.y, lado: c.side ?? 'foes', n: footprintOf(c.size) })); } catch {}
  fora[cena] = {
    w: f.w, h: f.h, bloqueia, objetos, arestas, bando,
    luzes: (m.luzes ?? []).map((l) => ({ x: l.pos.x, y: l.pos.y, claro: l.claro ?? 0, penumbra: l.penumbra ?? 0, tipo: l.tipo ?? 'fogueira' })),
    pecas: (m.objetos ?? []).filter((o) => o.tipo === 'prop').map((o) => [o.x, o.y]),
    fundo: m.fundo ?? null,
  };
}
console.log(JSON.stringify(fora));
'''

COR = {1: (255, 214, 0), 2: (60, 230, 90), 3: (60, 230, 90), 4: (255, 150, 40),
       5: (190, 110, 255), 6: (190, 110, 255), 7: (120, 255, 200), 8: (190, 110, 255)}


def dados(cenas):
    base = 'file:///' + RAIZ.replace('\\', '/')
    r = subprocess.run(['node', '--import', './src/dev/cena-node/register.mjs', '--input-type=module',
                        '-e', PROGRAMA.replace('@BASE@', base)],
                       cwd=RAIZ, capture_output=True, text=True,
                       env={**os.environ, 'CENAS': json.dumps(cenas)})
    if r.returncode:
        sys.exit('nao consegui rodar o motor:\n' + r.stderr.strip()[-1500:])
    return json.loads(r.stdout.strip().splitlines()[-1])


def retrato(cena, d):
    larg, alt = d['w'] * PX, d['h'] * PX
    im = Image.new('RGB', (larg, alt), (26, 22, 20))
    fundo = d.get('fundo') or {}
    cam = fundo.get('url', '')
    if cam.startswith('/'):
        caminho = os.path.join(RAIZ, 'public', *cam.strip('/').split('/'))
        if os.path.exists(caminho):
            arte = Image.open(caminho).convert('RGB')
            esc = fundo.get('escala', 100)
            alvo = (int(arte.size[0] / esc * PX), int(arte.size[1] / esc * PX))
            im.paste(arte.resize(alvo, Image.LANCZOS),
                     (int(fundo.get('x0', 0) / esc * PX), int(fundo.get('y0', 0) / esc * PX)))
    cap = im.copy()
    v = ImageDraw.Draw(cap, 'RGBA')

    for x, y in d['bloqueia']:
        v.rectangle([x * PX, y * PX, x * PX + PX - 1, y * PX + PX - 1], fill=(220, 40, 40, 60))
    for x, y in d['objetos']:
        v.rectangle([x * PX + 6, y * PX + 6, x * PX + PX - 7, y * PX + PX - 7], outline=(80, 170, 255, 230), width=2)
    for x, y in d['pecas']:
        c = (x * PX + PX // 2, y * PX + PX // 2)
        v.ellipse([c[0] - 5, c[1] - 5, c[0] + 5, c[1] + 5], fill=(255, 255, 255, 220))

    for l in d['luzes']:
        c = (l['x'] * PX + PX // 2, l['y'] * PX + PX // 2)
        for pes, cor in ((l['claro'] + l['penumbra'], (255, 170, 60, 40)), (l['claro'], (255, 240, 170, 70))):
            if pes <= 0:
                continue
            r = pes / 5 * PX
            v.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=cor)
        v.ellipse([c[0] - 4, c[1] - 4, c[0] + 4, c[1] + 4], fill=(255, 230, 120, 255), outline=(60, 30, 0, 255))

    for x, y, lado, cod in d['arestas']:
        cor = COR.get(cod, (255, 214, 0))
        larga = 4 if cod == 1 else 3
        if lado == 'N':
            v.line([x * PX, y * PX, x * PX + PX, y * PX], fill=cor + (245,), width=larga)
        else:
            v.line([x * PX, y * PX, x * PX, y * PX + PX], fill=cor + (245,), width=larga)

    for b in d['bando']:
        n = b.get('n', 1)
        x0, y0 = b['x'] * PX, b['y'] * PX
        x1, y1 = x0 + n * PX, y0 + n * PX
        cor = (255, 90, 90, 255) if b['lado'] == 'foes' else (120, 220, 255, 255)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        v.polygon([(cx, y0 + 4), (x1 - 4, cy), (cx, y1 - 4), (x0 + 4, cy)], outline=cor, width=3)

    return cap


def main():
    os.makedirs(SAIDA, exist_ok=True)
    pedidas = sys.argv[1:] or ['esconderijo', 'mansao', 'poco', 'cume', 'castelo', 'arvoreTrovao', 'ondaEco']
    d = dados(pedidas)
    for cena in pedidas:
        if cena not in d:
            print(f'{cena}: nao existe'); continue
        im = retrato(cena, d[cena])
        p = os.path.join(SAIDA, f'{cena}.png')
        im.save(p)
        c = d[cena]
        arte = 'com a arte' if (c.get('fundo') or {}).get('url') and os.path.exists(
            os.path.join(RAIZ, 'public', *(c['fundo']['url'].strip('/').split('/')))) else 'SEM a arte no disco'
        print(f'{cena:14} {c["w"]}x{c["h"]}  {len(c["arestas"])} arestas, {len(c["luzes"])} luzes, '
              f'{len(c["objetos"])} objetos no chão, {len(c["pecas"])} peças, {len(c["bando"])} criaturas — {arte}')
        print(f'               {p}')


if __name__ == '__main__':
    main()
