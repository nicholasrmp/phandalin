# -*- coding: utf-8 -*-
"""MEDE O QUANTO O TEXTO DO JOGO ESTÁ COLADO NO LIVRO. Rode com:

    python src/dev/conferir-colagem.py              # o jogo inteiro, a partir de 6 palavras
    python src/dev/conferir-colagem.py --min 10     # só o que for grave
    python src/dev/conferir-colagem.py src/game/capitulo2.js

Para cada texto do jogo — fala, descrição, pista E COMENTÁRIO DE CÓDIGO —, acha a MAIOR sequência de palavras
que aparece igual no PDF do livro (`_referencias/livro/`, que não entra no repositório). Não é opinião sobre
estilo: é n-grama compartilhado, contado, ignorando acento, caixa e pontuação.

POR QUE ELE EXISTE. Dois revisores de fidelidade acusaram "texto perto demais do livro" em catorze trechos, e
a medida mostrou que **nenhum deles compartilhava uma frase sequer** com o original: o que eles tinham em comum
era a ORDEM DAS IDEIAS, que é outra conversa e se resolve reescrevendo a estrutura. Em compensação, a mesma
medida achou o que ninguém tinha procurado: NOVE CITAÇÕES LITERAIS do livro, de 14 a 39 palavras, entre aspas
dentro de COMENTÁRIOS de código — postas de boa-fé, para justificar uma decisão medida ("o livro diz X, então
fazemos Y"). Comentário vai para o repositório como qualquer outra linha, e a regra do projeto é não copiar
texto do livro. Todas foram trocadas pelo fato, com as nossas palavras.

O QUE SOBRA E POR QUÊ. Depois da limpeza o maior trecho do jogo inteiro tem NOVE palavras, e são nomes
próprios e descrições de objeto que não têm como ser outra coisa: "com um necromante chamado Tsernoth na cidade
de Iriaebor", "as ruínas do Poço da Coruja Velha". Nome é fato; fato não se reescreve. Por isso o limite útil
deste conferidor é por volta de 10: abaixo disso ele só devolve nome próprio e lista de item.

O PDF é referência de medida e NÃO entra no repositório nem na publicação (como os battlemaps da FA). Sem ele,
o conferidor avisa e sai sem erro, para não quebrar quem clonou o projeto.
"""
import glob
import io
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIVRO = os.path.join(RAIZ, '_referencias', 'livro', 'mina-perdida-de-phandelver.pdf')
N = 4                        # a janela de busca; o trecho devolvido cresce a partir dela


def normal(t):
    t = unicodedata.normalize('NFKD', t.lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', ' ', t)).strip()


def main():
    args = [a for a in sys.argv[1:]]
    minimo = 6
    if '--min' in args:
        i = args.index('--min')
        minimo = int(args[i + 1])
        del args[i:i + 2]
    if not os.path.exists(LIVRO):
        print(f'o PDF do livro não está em {LIVRO} — ele é referência de medida e não entra no repositório.')
        return 0
    try:
        import pypdf
    except ImportError:
        print('falta o pypdf: pip install pypdf')
        return 0

    pdf = pypdf.PdfReader(LIVRO)
    pal = normal(' '.join((p.extract_text() or '') for p in pdf.pages)).split(' ')
    janela = {}
    for i in range(len(pal) - N + 1):
        janela.setdefault(' '.join(pal[i:i + N]), []).append(i)

    alvos = [os.path.join(RAIZ, a) for a in args] or (
        sorted(glob.glob(os.path.join(RAIZ, 'src', 'game', '*.js')))
        + sorted(glob.glob(os.path.join(RAIZ, 'src', 'rules', '**', '*.js'), recursive=True)))

    achados = []
    for caminho in alvos:
        s = io.open(caminho, encoding='utf-8').read()
        # TUDO conta: literal de texto e comentário. A citação entre aspas dentro de comentário foi
        # justamente onde estavam as nove cópias literais.
        for m in re.finditer(r"'([^'\n]{40,})'|\"([^\"\n]{40,})\"|`([^`]{40,}?)`|//(.{40,})|\*(.{40,})", s):
            bruto = next(g for g in m.groups() if g)
            p = normal(bruto).split(' ')
            melhor = []
            for i in range(len(p) - N + 1):
                for j in janela.get(' '.join(p[i:i + N]), []):
                    k = N
                    while i + k < len(p) and j + k < len(pal) and p[i + k] == pal[j + k]:
                        k += 1
                    if k > len(melhor):
                        melhor = p[i:i + k]
            if len(melhor) >= minimo:
                achados.append({'arquivo': os.path.relpath(caminho, RAIZ).replace('\\', '/'),
                                'linha': s[:m.start()].count('\n') + 1,
                                'n': len(melhor), 'comum': ' '.join(melhor)})

    # um trecho do livro por achado: a mesma citação partida em várias linhas de comentário vira várias
    vistos = set()
    unicos = []
    for a in sorted(achados, key=lambda a: -a['n']):
        if a['comum'] in vistos:
            continue
        vistos.add(a['comum'])
        unicos.append(a)
    for a in unicos:
        print(f"{a['n']:3d}  {a['arquivo']}:{a['linha']}  <<{a['comum']}>>")
    print(f"\n{len(unicos)} trecho(s) com {minimo}+ palavras seguidas iguais ao livro")
    io.open(os.path.join(RAIZ, 'src', 'dev', '_tmp', 'colagem.json'), 'w', encoding='utf-8').write(
        json.dumps(unicos, ensure_ascii=False, indent=1)) if os.path.isdir(
            os.path.join(RAIZ, 'src', 'dev', '_tmp')) else None
    return 0


if __name__ == '__main__':
    sys.exit(main())
