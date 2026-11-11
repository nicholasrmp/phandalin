"""Baixa a ARTE INTEIRA de cada criatura (a ilustração do livro, de corpo inteiro), para a ficha do inimigo.

    python src/dev/baixar-arte-criaturas.py          # seco: quantas acha, quais faltam, quanto pesa
    python src/dev/baixar-arte-criaturas.py --go     # baixa e converte

O token redondo (`public/fichas/`, `baixar-fichas.py`) é o recorte do rosto; a ficha da criatura mostra a figura toda.
As duas vêm do mesmo lugar: o espelho do 5etools no GitHub. O nome de cada criatura no livro sai das listas que os
tokens já usam — `bestiario/fichas-mm.json` (o MM importado), `fichas-5etools.json` (as da aventura) e
`fichas-imgur.json` (o nome da galeria, procurado no MM) — mais `EXTRA`, para as pessoas com nome cujo token é arte
nossa. O caminho da imagem é o do `fluff-bestiary-<livro>.json` (o campo `images`), seguindo `_copy` quando o livro
manda a criatura usar a ilustração de outra (o chefe goblin usa a do goblin).

A ARTE É DA WIZARDS: como os mapas oficiais, ela fica no disco de quem a baixou e NÃO entra no repositório nem na
publicação. `public/criaturas/` está no `.gitignore`, e `verificar-publicavel.mjs` recusa publicar o que o git
ignora. Sem a pasta, a ficha mostra o token grande no lugar da figura.

O original vai para `_referencias/arte-criaturas/<id>.webp`, sem mexer; o jogo recebe `public/criaturas/<id>.webp`,
reduzido a ALTURA de 760 px (a figura ocupa até ~620 px de altura na ficha a 1440x900; sobra para tela densa).
"""
import io
import json
import os
import sys
import urllib.request

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEV = os.path.join(RAIZ, 'src', 'dev')
FLUFF_LOCAL = os.path.join(RAIZ, '_referencias', '5etools', 'bestiary')
CRU = os.path.join(RAIZ, '_referencias', 'arte-criaturas')
SAIDA = os.path.join(RAIZ, 'public', 'criaturas')
BASE_DADO = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-2014-src/main/data/bestiary'
BASE_IMG = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-2014-img/main'
ALTURA = 760

# As pessoas com nome cujo token é arte nossa (`fichas-proprias.json`): o livro tem a ilustração delas.
EXTRA = {
    'klarg': ('LMoP', 'Klarg'),
    'nezznar': ('LMoP', 'Nezznar the Black Spider'),
    'iarno': ('LMoP', 'Evil Mage'),
    'cajavidro': ('LMoP', 'Evil Mage'),
    'agatha': ('LMoP', 'Agatha'),
    'marcarrubra': ('LMoP', 'Redbrand Ruffian'),
    'vigiaCiclopico': ('MM', 'Spectator'),
}


def ler(caminho):
    with open(caminho, encoding='utf8') as f:
        return json.load(f)


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


_fluff = {}


def fluff(livro):
    """O fluff do livro: do disco, se o importador já o trouxe; senão do espelho (guardado ao lado, fora do repo)."""
    livro = livro.lower()
    if livro in _fluff:
        return _fluff[livro]
    caminho = os.path.join(FLUFF_LOCAL, f'fluff-bestiary-{livro}.json')
    if not os.path.exists(caminho):
        os.makedirs(FLUFF_LOCAL, exist_ok=True)
        try:
            dado = baixar(f'{BASE_DADO}/fluff-bestiary-{livro}.json')
        except Exception as e:  # livro sem fluff no espelho
            print(f'  (sem fluff de {livro}: {e})')
            _fluff[livro] = {}
            return _fluff[livro]
        with open(caminho, 'wb') as f:
            f.write(dado)
    _fluff[livro] = {(m['name'].lower(), m['source'].lower()): m for m in ler(caminho).get('monsterFluff', [])}
    return _fluff[livro]


def imagem(livro, nome, fundo=0):
    """O caminho da ilustração no espelho, seguindo `_copy`; None se o livro não tem."""
    if fundo > 5:
        return None
    m = fluff(livro).get((nome.lower(), livro.lower()))
    if not m:
        return None
    proprias = list(m.get('images') or [])
    copia = m.get('_copy')
    if copia:
        # `_mod.images` é a ilustração DESTA criatura por cima da do grupo que ela copia (o dragão negro adulto copia o
        # dragão negro, que copia os dragões cromáticos e acrescenta a figura dele): a dela vem primeiro.
        mod = (copia.get('_mod') or {}).get('images')
        for op in mod if isinstance(mod, list) else [mod] if mod else []:
            itens = op.get('items') if isinstance(op, dict) else None
            proprias += itens if isinstance(itens, list) else [itens] if itens else []
    for im in proprias:
        href = im.get('href', {}) if isinstance(im, dict) else {}
        if href.get('type') == 'internal' and href.get('path'):
            return href['path']
    if copia:
        return imagem(copia.get('source', livro), copia['name'], fundo + 1)
    return None


def lista():
    """id da criatura no jogo -> (livro, nome no livro)."""
    alvo = {}
    for k, (livro, arquivo) in ler(os.path.join(DEV, 'bestiario', 'fichas-mm.json')).items():
        alvo[k] = (livro, os.path.splitext(arquivo)[0])
    for k, v in ler(os.path.join(DEV, 'fichas-imgur.json')).items():
        if k.startswith('_'):
            continue
        alvo.setdefault(k, ('MM', v[1]))
    for k, v in ler(os.path.join(DEV, 'fichas-5etools.json')).items():
        if k.startswith('_'):
            continue
        alvo[k] = (v[0], os.path.splitext(v[1])[0])
    alvo.update(EXTRA)
    return alvo


def main():
    go = '--go' in sys.argv
    achadas, faltam = {}, []
    for cid, (livro, nome) in sorted(lista().items()):
        caminho = imagem(livro, nome)
        if caminho:
            achadas[cid] = caminho
        else:
            faltam.append(f'{cid} ({livro}: {nome})')
    print(f'{len(achadas)} criaturas com ilustração no livro; {len(faltam)} sem.')
    if faltam:
        print('Sem ilustração (a ficha mostra o token):', ', '.join(faltam))
    if not go:
        print('Seco. Rode com --go para baixar.')
        return
    os.makedirs(CRU, exist_ok=True)
    os.makedirs(SAIDA, exist_ok=True)
    def um(par):
        """Baixa (se ainda não está no disco) e converte uma; devolve (bytes gravados, erro)."""
        cid, caminho = par
        cru = os.path.join(CRU, f'{cid}.webp')
        try:
            if not os.path.exists(cru):
                dado = baixar(f'{BASE_IMG}/{urllib.request.quote(caminho)}')
                with open(cru, 'wb') as f:
                    f.write(dado)
            saida = os.path.join(SAIDA, f'{cid}.webp')
            if os.path.exists(saida) and os.path.getmtime(saida) >= os.path.getmtime(cru):
                return os.path.getsize(saida), None
            im = Image.open(cru).convert('RGBA')
            if im.height > ALTURA:
                im = im.resize((round(im.width * ALTURA / im.height), ALTURA), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, 'WEBP', quality=82, method=4)
            with open(saida, 'wb') as f:
                f.write(buf.getvalue())
            return buf.tell(), None
        except Exception as e:
            return 0, f'{cid}: {e}'

    # Oito de cada vez: uma a uma eram ~4 por minuto, e o tempo era quase todo de espera pela rede.
    from concurrent.futures import ThreadPoolExecutor
    total, falhas = 0, []
    with ThreadPoolExecutor(8) as pool:
        for i, (n, erro) in enumerate(pool.map(um, sorted(achadas.items())), 1):
            total += n
            if erro:
                falhas.append(erro)
            if i % 50 == 0:
                print(f'  {i}/{len(achadas)}', flush=True)
    print(f'Gravadas {len(achadas) - len(falhas)} em public/criaturas/, {total / 1e6:.1f} MB.')
    if falhas:
        print('Falharam:', '; '.join(falhas))


if __name__ == '__main__':
    main()
