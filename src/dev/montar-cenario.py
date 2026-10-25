# -*- coding: utf-8 -*-
"""
Monta o atlas dos objetos de cenario a partir dos candidatos do PixelLab.

Cada objeto entra recortado na propria caixa e com uma ANCORA: o pixel do
desenho que cai no centro do losango da casa. E pela ancora que o tabuleiro
posiciona, nao pelo canto da imagem -- assim um objeto de qualquer tamanho
assenta no chao do mesmo jeito.

Como a ancora sai de cada tipo:
  tronco   a base do tronco: a fileira mais baixa do desenho e, nela, a
           mediana dos pixels acesos. Nao e o centro da caixa: uma arvore
           inclinada tem o tronco fora do centro, e ancorar pelo centro a
           deixaria pendurada ao lado da propria casa.
  base     objeto baixo e largo (arbusto, pedra): o centro da elipse da base,
           um quarto da altura acima do fundo.

A escolha dos quadros e uma decisao de arte, registrada aqui com o porque.
Nada e redimensionado: o tabuleiro desenha cenario 1:1.
"""
import json
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parents[2]
OBJ = AQUI / '_referencias' / 'pixellab' / 'objetos'
SAIDA = AQUI / 'src' / 'art' / 'folhas'

GRUPOS = {
    # Dos 16 candidatos: 0-5, 8 e 13 sao carvalhos de copa redonda e tronco
    # visivel, todos com a mesma luminancia mediana (51,8) -- nao fazem xadrez
    # quando sorteados. O 6 e massa densa e mais escura, para o miolo da mata.
    # Ficaram de fora 9 (retorcida), 11 (chorao), 12 (alamo), 14 (folha
    # espinhenta) e 15 (galho seco), que sao outras especies e quebrariam a
    # mata; 10, pequena demais; 7, de laterais retas, que le como sebe.
    # A primeira leva de arvore tinha 65 a 80 px: muda, do tamanho de um
    # heroi, ao lado das altas de 150. Esta foi pedida numa tela de 112 e deu
    # uns 100 px, com tronco grosso aparecendo.
    'arvore': {
        'pasta': 'arvore3/36655f47-7031-4dda-95e7-82a3b39b80d7',
        'quadros': {'borda': [0, 1, 3], 'miolo': [2]},
        'ancora': 'tronco',
    },
    # As arvores altas da mata esparsa, 126-151 px: umas tres alturas de
    # personagem. De dois lotes de quatro. Fora: B1, quase preta (lum 22) --
    # vira buraco na mata --, e A2, estreita demais (80 px) para o quinconce,
    # onde cada copa precisa cobrir a casa vizinha.
    'arvore-alta': {
        'fontes': [('arvore-alta/9a197ca2-a5af-441f-85ae-f3f57e97da79', [0, 1, 3]),
                   ('arvore-alta-2/e3af68f5-b398-4ca7-80ce-4e96ac1719fb', [0, 2, 3])],
        'papel': 'todas',
        'ancora': 'tronco',
    },
    # Dos 16: 0, 3, 6, 8, 10, 11, 12 e 14 sao moitas de bolas redondas com a
    # mesma luminancia mediana (51,8). Fora: 1, claro demais (95); 2, chato,
    # le como pedra com musgo; 4, conifera; 5, 7 e 15, folhagem rala de outra
    # especie; 9, pequeno demais; 13, rasteiro demais para dar cobertura.
    'arbusto': {
        'pasta': 'arbusto/408d5c8d-1de7-4dc1-92f2-5dd5eac1790d',
        'quadros': {'todas': [0, 3, 6, 8, 10, 11, 12, 14]},
        'ancora': 'base',
    },
    # Dos 64: 0, 1, 12, 15, 32, 35, 43, 48 e 60 sao pedregulhos naturais com
    # volume -- a pedra do mapa e meia cobertura, precisa ler como algo atras
    # do que se agacha. Fora: degraus (36, 55, 63), lajes chatas (21, 22, 29,
    # 30, 33, 34, 41, 42, 51, 59), menires (38, 46), montes empilhados que
    # leem como feitos a mao (3, 7, 8, 20, 23, 28, 31, 53, 54, 61), as de
    # musgo escuro (5, 9, 10, 44, 45), cascalho (13, 16, 24) e lascas (11, 17,
    # 18, 25, 26, 49, 57).
    'pedra': {
        'pasta': 'pedra/aa8b067a-ea2a-488a-8a96-dd4470ca3c42',
        'quadros': {'todas': [0, 1, 12, 15, 32, 35, 43, 48, 60]},
        'ancora': 'base',
    },
    # O ESCONDERIJO. Estalagmites: os cones naturais. Fora: 1 e 5, em
    # camadas, leem como bolo; 7, gancho; 8, toco; 9, bolas empilhadas; 10,
    # cristais (outra coisa no jogo); 11, baixo demais para cobertura; 12, em
    # V; 13, domo; 14, bloco quebrado; 15, retorcido.
    'estalagmite': {
        'pasta': 'estalagmite/471bb363-ba17-4c60-bdb9-d170e6810144',
        'quadros': {'todas': [0, 2, 3, 4, 6]},
        'ancora': 'base',
    },
    # Mantimentos: quase todos servem. Fora: 1, pequeno demais; 6, 10 e 12,
    # so sacos ou so barris -- a pilha precisa misturar, para ler como saque.
    'mantimentos': {
        'pasta': 'mantimentos/690ec642-2d29-4be0-b92d-fa6cf57de35b',
        'quadros': {'todas': [0, 2, 3, 4, 5, 7, 8, 9, 11, 13, 14, 15]},
        'ancora': 'base',
    },
    # Espinheiro: os emaranhados de galho com espinho. Fora: 1, arcos limpos
    # demais; 2, 10 e 14, ralos a ponto de sumir; 3, 6, 7, 8 e 13, capim ou
    # folhagem, que leriam como moita (cobertura) e o espinheiro e so terreno
    # dificil.
    'espinheiro': {
        'pasta': 'espinheiro/9eea6415-d75b-4d5a-bd78-e9607e9250fb',
        'quadros': {'todas': [0, 4, 5, 9, 11, 12, 15]},
        'ancora': 'base',
    },
    # Camas do bando. ESTA LEVA VEIO COM A DESCRICAO ESCRITA embaixo de cada
    # desenho, em pixel: `corta_texto` fica so com o primeiro bloco de linhas
    # acesas de cima para baixo, e o texto (separado por uma faixa vazia) cai
    # fora. Fora: 4 e 5, colchas de retalho que leem como tapete; 7 e 11,
    # trouxas amarradas; 8, cranio; 12, ninho; 13 e 15, panos soltos.
    'leito': {
        'pasta': 'leito/ee5581ee-d05b-4cac-a2ef-9368e90c4c4b',
        'quadros': {'todas': [0, 1, 2, 3, 6, 9, 10, 14]},
        'ancora': 'base',
        'corta_texto': True,
    },
    # A fogueira de Klarg: as de pedra em roda e lenha. Fora as que trazem
    # panela, espeto, grelha ou chaleira (2, 4, 5, 7, 8, 9, 14), a que so tem
    # brasa (10) e a de mochila (15).
    'fogueira': {
        'pasta': 'fogueira/196601da-f79e-4697-a76e-16641718f07a',
        'quadros': {'todas': [0, 3, 6, 11, 12]},
        'ancora': 'base',
    },
    # O posto dos vigias (area 2): biombos de ripas amarradas entre galhos.
    # Fora: 4 e 6, fechados demais (leem como caixote); 5, cranio; 7, couro;
    # 9, em perspectiva; 10, porta; 11, estandarte; 12, so folhagem; 14,
    # desmontado.
    'tocaia': {
        'pasta': 'tocaia/513bd23b-7e5e-444a-81d9-de370a087f91',
        'quadros': {'todas': [0, 1, 2, 3, 8, 13, 15]},
        'ancora': 'base',
    },
    # O porao da mansao. Mesa: fora 6, 8-12, 14 e 15 (papel grande ou objeto
    # alto demais por cima). Sarcofago: so os de tampa inteira e fechada --
    # a cena manda abrir --, fora os quebrados, acorrentados e com cipo.
    'mesa': {
        'pasta': 'mesa/62f79e21-9e1f-483b-ae95-1d240c419f33',
        'quadros': {'todas': [0, 1, 2, 3, 4, 5, 7, 13]},
        'ancora': 'base',
    },
    'sarcofago': {
        'pasta': 'sarcofago/f778cffd-2bb5-4d84-af27-eb6a15fde315',
        'quadros': {'todas': [0, 1, 2, 3, 9]},
        'ancora': 'base',
    },
    # O poco velho do Poco da Coruja Velha: os de armacao e balde, inteiros.
    # Fora os de cipo (2, 4, 10), o de telhadinho (6), o sem armacao (12) e
    # os de tampa ou tabua (5, 8, 13, 14, 15).
    'pocoVelho': {
        'pasta': 'pocoVelho/72b3fdb1-a2f7-4f03-b90f-840fe6d5e556',
        'quadros': {'todas': [0, 1, 3, 7, 9, 11]},
        'ancora': 'base',
    },
    # DECORACAO DE PAREDE do castelo: pendurada na face da parede de borda,
    # nao no chao. Uma leva de 64, ja desenhada no plano da face isometrica.
    # Os papeis dizem o que cada coisa E, e o mapa escolhe pelo papel.
    'decorParede': {
        'pasta': 'paredeDecor/a007d8da-3f35-4982-87ab-5e9077eca3be',
        # Curado olhando no tabuleiro: fora os suportes horizontais de
        # ferramenta (18, 50) e os escudos redondos (26, 33, 36, 57), que
        # na parede leem como cano e tampa de esgoto, e a rachadura (31),
        # que parece um risco e nao musgo.
        'quadros': {
            'tochaAcesa': [0, 42, 55],
            'tochaApagada': [1, 27],
            'quadro': [2, 46, 60],
            'bandeira': [3, 13, 43, 59],
            'musgo': [4],
            'teia': [5],
            'corrente': [6, 48, 53],
            'cranio': [7, 38, 62],
            'armas': [39],
            'escudo': [9, 20],
        },
        'ancora': 'centro',
    },
    # OS VAOS da parede de borda: porta, arco e porta escorada, ja desenhados
    # no plano da face isometrica. Antes eu desenhava a folha de madeira e o
    # arco a mao, no canvas, e aparecia que era desenho meu e nao arte.
    # Escolhidos: porta de tabuas com ferragem (0), porta em arco (6, 10) e
    # porta dupla (13); arco de pedra vazio (1) e arco com escombro (12);
    # escorada com a trava atravessada (2, 15).
    'vaoParede': {
        'pasta': 'vaoDeParede/30cc9f14-9c6e-4c04-bd26-ccb1083efda7',
        'quadros': {'porta': [0, 6, 10, 13], 'arco': [1, 12], 'barrada': [2, 15]},
        'ancora': 'centro',
    },
    # O bau: os de madeira com cinta de ferro. Fora os dourados (3, 6, 15),
    # o de corrente (8) e o de tabuas cruzadas (5).
    'bau': {
        # A primeira leva deu baus de 59 px de largura, quase um heroi
        # deitado; esta foi pedida numa tela de 44 e deu 37 x 31.
        'pasta': 'bau3/9f1a57b8-a484-4c9f-bde1-b6ac63ab7b89',
        'quadros': {'todas': [0, 3, 7, 9, 12, 15]},
        'ancora': 'chao',
    },
    # O Castelo Dentefino. Braseiros: tigela de pedra e cobre, acesos; o do
    # salao escuro e o de carvao frio. Fora: os de outra forma (caixa preta,
    # gargula, carrinho, pendurado, anel de chao), que liam como outra coisa.
    # A primeira leva de braseiro saiu com 60 px -- a altura de um heroi --
    # porque o objeto enche a tela que se pede, e a tela era 64. Esta foi
    # pedida numa tela de 48 e deu 35 a 46 px, na altura da cintura. Nela os
    # quadros pares estao acesos e os impares, apagados.
    'braseiro': {'pasta': 'braseiro3/89021477-68cb-4e2b-bb7a-9e33bc8d74c0',
                 'quadros': {'todas': [0, 2, 4, 6]}, 'ancora': 'chao'},
    'braseiroFrio': {'pasta': 'braseiro3/89021477-68cb-4e2b-bb7a-9e33bc8d74c0',
                     'quadros': {'todas': [1, 7]}, 'ancora': 'chao'},
    'armeiro': {'pasta': 'armeiro/e20c304d-0abb-4748-a688-5f0739401856',
                'quadros': {'todas': [0, 1, 5, 9, 14]}, 'ancora': 'chao'},
    # A primeira leva de palha veio clara e com uma LAJE de pedra desenhada
    # por baixo: no tabuleiro aquilo lia como palete. Esta foi pedida sem base
    # e ja na paleta escura. Fora: as que viram ninho, novelo de corda ou
    # emaranhado preto.
    'palha': {'pasta': 'palha2/1d6731c3-430b-4e58-9165-1bf2180d781f',
              'quadros': {'todas': [0, 1, 3, 9]}, 'ancora': 'deitado'},
    # Escombro que barra o passo: so os montes altos (fora o cascalho raso,
    # a grade, o arco e o estandarte).
    'desabamento': {'pasta': 'desabamento/cb5332a0-ec17-42b9-9cc3-1ef3d9e8fe25',
                    'quadros': {'todas': [1, 2, 3, 4, 5, 9, 11, 15]}, 'ancora': 'deitado'},
}

DIRECOES = ['south', 'south-east', 'east', 'north-east',
            'north', 'north-west', 'west', 'south-west']
DIAGONAIS = ['south-east', 'north-east', 'north-west', 'south-west']
# A CAMERA E FIXA: o tabuleiro nao gira mais, entao cada objeto usa UMA vista
# so -- a que o `olha` dele pede (`board.spriteDirecional`: (1,0) e sudeste,
# (0,1) sudoeste, (0,-1) nordeste, (1,-1) leste). Guardar as quatro diagonais
# gastava um terco do atlas em quadros que nunca apareciam.
SE, SO, NE, L, O = ['south-east'], ['south-west'], ['north-east'], ['east'], ['west']

# Objetos com direcao: as oito vistas de `rotation_urls`, uma por papel, e o
# tabuleiro escolhe pela rotacao da camera. `ancora` aqui e o centro da
# pegada no chao: o centro da caixa em x e, em y, o fundo menos `meia_pegada`
# -- a roda da frente ou o corpo deitado tocam o chao na borda da FRENTE da
# pegada, que fica meia pegada abaixo do centro dela. Calibrado na medicao.
DIRIGIDOS = {
    'carroca': {'pasta': 'carroca/e391322f-b2a9-4b1c-a7ef-4c1b55116880', 'meia_pegada': 14, 'direcoes': SE},
    # Os dois cavalos caidos da emboscada: o baio de perfil para leste, o
    # tordilho (mesmo desenho, pelagem trocada) para oeste.
    'cavalo': {'pasta': 'cavalo/2d4dd2f2-d929-454d-bf40-97ae971d184d', 'meia_pegada': 9,
               'direcoes': L + O, 'recolor': ('tordilho', None)},
    # A ponte do esconderijo: tabuleiro de 2 x 2 casas com corrimao de corda.
    # A rua de Phandalin: pegada de 3 x 3 casas, cujo centro fica 48 px acima
    # da quina da frente; o pe da parede fica um pouco recuado da quina.
    # O colmo saiu mais claro que a estrada (luminancia 121 contra 99): o
    # telhado tem de ser a parte mais escura, entao as tres cores dele descem.
    'casa-a': {'pasta': 'casa-a/d0fbc498-ad5b-4a1f-9d3f-20f70b17b577', 'meia_pegada': 44, 'direcoes': SO + NE,
               'cores': {'#8f7a3e': '#66572c', '#6e5a2c': '#4c3e1f', '#b39d5c': '#85733f'}},
    'casa-b': {'pasta': 'casa-b/b991eb38-97fc-48fa-b31c-1d74a61e2e46', 'meia_pegada': 44, 'direcoes': SO},
    'taverna': {'pasta': 'taverna/e672b189-bc57-474d-ae3c-db375a0c3da5', 'meia_pegada': 44, 'direcoes': SO},
    # A tenda do Mago Vermelho no Poco da Coruja Velha: pegada de 2 x 2.
    'tenda': {'pasta': 'tenda/87bd764f-d760-4411-b99c-ce86c8a5afa6', 'meia_pegada': 24, 'direcoes': SO},
    # O Castelo Dentefino: moveis de varias casas.
    'altar': {'pasta': 'altar/f1c6ef6a-9358-4fd8-a72d-a11f333c029f', 'meia_pegada': 22, 'direcoes': SO},
    'banheira': {'pasta': 'banheira/f3ace672-b48e-48f7-afac-1d1a7f83b840', 'meia_pegada': 20, 'direcoes': SE},
    'mesaBanquete': {'pasta': 'mesaBanquete/6267f6c9-c151-4822-9f48-fc6b6831f5fb', 'meia_pegada': 24, 'direcoes': SO},
    'camaRei': {'pasta': 'camaRei/13ea8bbb-b47d-4d0f-9095-c8155ed2ddba', 'meia_pegada': 28, 'direcoes': SO},
    'portaoQuebrado': {'pasta': 'portaoQuebrado/acfd293b-b5cf-4b0b-b5ae-461c361cfdb0', 'meia_pegada': 20, 'direcoes': SO},
}

# O cavalo B e o mesmo desenho com a pelagem trocada, cor por cor exata: baio
# para tordilho. A sela usa as mesmas cores do pelo e fica cinza junto; o
# sangue (#4a1510) e o contorno ficam. Custa zero geracao e os dois nunca leem como copia, porque
# alem da pelagem eles cairam em sentidos opostos (o B usa as vistas opostas).
PELAGEM = {
    '#3e2a1b': '#4e4e52', '#45291a': '#5a5a5c', '#5e4029': '#7a7874',
    '#683d25': '#8e8b84', '#8a6a44': '#b4afa2',
}


def recolorir(im, mapa):
    alvo = {tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)): tuple(int(v[i:i + 2], 16) for i in (1, 3, 5))
            for k, v in mapa.items()}
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in alvo:
                px[x, y] = alvo[(r, g, b)] + (a,)
    return out


def corta_texto(im):
    """So o primeiro bloco de linhas acesas, de cima para baixo."""
    px = im.load()
    linhas = [any(px[x, y][3] for x in range(im.width)) for y in range(im.height)]
    ini = linhas.index(True)
    fim = ini
    while fim < im.height and linhas[fim]:
        fim += 1
    parte = im.crop((0, ini, im.width, fim))
    return parte.crop(parte.getbbox())


def ancora(im, modo):
    """Onde a casa toca o desenho.

    O tabuleiro desenha o objeto em (centro da casa - ancora), entao ancora
    ALTA sobe o objeto. 'tronco' acha o pe da arvore. O resto e uma fracao da
    altura, medida do fundo para cima:

      0,25  o padrao, para quem tem base de elipse larga (moita, pedra);
      0,10  quem se apoia no chao pelo fundo do desenho (bau, braseiro,
            armeiro, mesa): com 0,25 eles subiam e colavam na parede de tras;
      0,45  quem esta DEITADO no chao (palha, escombro): o desenho inteiro e
            a pegada, e o centro dele e o centro da casa.
    """
    px = im.load()
    w, h = im.size
    if modo == 'tronco':
        for y in range(h - 1, -1, -1):
            xs = [x for x in range(w) if px[x, y][3] > 0]
            if xs:
                return xs[len(xs) // 2], y
    fracao = {'chao': 0.10, 'deitado': 0.45}.get(modo, 0.25)
    return w // 2, h - 1 - int(h * fracao)


def main():
    LARG = 1024
    quadros = []          # (grupo, papel, origem, imagem, ancora)
    for nome, g in GRUPOS.items():
        if 'fontes' in g:
            for sub, idxs in g['fontes']:
                pasta = OBJ / sub
                if not pasta.exists():
                    print(f'  ({nome}: {sub} ainda nao existe, pulando)')
                    continue
                for i in idxs:
                    im = Image.open(pasta / f'frame_urls_{i}.png').convert('RGBA')
                    im = im.crop(im.getbbox())
                    quadros.append((nome, g['papel'], f'{sub.split("/")[0]}:{i}', im, ancora(im, g['ancora'])))
            continue
        pasta = OBJ / g['pasta']
        if not pasta.exists():
            print(f'  ({nome}: pasta ainda nao existe, pulando)')
            continue
        for papel, idxs in g['quadros'].items():
            for i in idxs:
                im = Image.open(pasta / f'frame_urls_{i}.png').convert('RGBA')
                im = corta_texto(im) if g.get('corta_texto') else im.crop(im.getbbox())
                if 'cores' in g:
                    im = recolorir(im, g['cores'])
                quadros.append((nome, papel, i, im, ancora(im, g['ancora'])))
    for nome, g in DIRIGIDOS.items():
        pasta = OBJ / g['pasta']
        if not pasta.exists():
            print(f'  ({nome}: pasta ainda nao existe, pulando)')
            continue
        # O tabuleiro so usa as quatro diagonais; o predio grande nao gasta
        # atlas com as outras quatro.
        for d in g.get('direcoes', DIRECOES):
            im = Image.open(pasta / f"storage_urls_{g.get('vista', {}).get(d, d)}.png").convert('RGBA')
            im = im.crop(im.getbbox())
            if 'cores' in g:
                im = recolorir(im, g['cores'])
            a = (im.width // 2, im.height - 1 - g['meia_pegada'])
            quadros.append((nome, d, d, im, a))
            if 'recolor' in g:
                variante, mapa = g['recolor']
                mapa = mapa or PELAGEM
                quadros.append((f'{nome}-{variante}', d, d, recolorir(im, mapa), a))

    # Empacotamento em fileiras, da esquerda para a direita.
    x = y = alt_fileira = 0
    posicoes = []
    for _, _, _, im, _ in quadros:
        if x + im.width > LARG:
            x, y, alt_fileira = 0, y + alt_fileira + 1, 0
        posicoes.append((x, y))
        x += im.width + 1
        alt_fileira = max(alt_fileira, im.height)
    atlas = Image.new('RGBA', (LARG, y + alt_fileira), (0, 0, 0, 0))
    meta = {}
    for (nome, papel, i, im, (ax, ay)), (px, py) in zip(quadros, posicoes):
        atlas.alpha_composite(im, (px, py))
        meta.setdefault(nome, {}).setdefault(papel, []).append(
            {'x': px, 'y': py, 'w': im.width, 'h': im.height, 'ax': ax, 'ay': ay, 'origem': i})
    atlas.save(SAIDA / 'cenario.png', optimize=True)
    (SAIDA / 'cenario.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print(f'{SAIDA / "cenario.png"}  {atlas.size}  {(SAIDA / "cenario.png").stat().st_size / 1024:.0f} KB')
    for nome, papeis in meta.items():
        for papel, fs in papeis.items():
            print(f'  {nome}/{papel}: {len(fs)} quadros, alturas {[f["h"] for f in fs]}')


if __name__ == '__main__':
    main()
