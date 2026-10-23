# -*- coding: utf-8 -*-
"""
Aplica o veredito do revisor-chefe a uma folha e acumula a fila de refação.

    python src/dev/icones_veredito.py <pasta-da-folha> <veredito-do-chefe.json>
    python src/dev/icones_veredito.py --montar-refacao [--por-folha 24]

O veredito do chefe (o JSON que o agente `revisor-icones` devolve) tem, por
ícone, um de quatro destinos, e cada um vira uma coisa diferente aqui:

- `aprovado` e `aceitar-com-ressalva` — ficam. A ressalva vai para
  `ressalvas.json`, para uma rodada futura, mas não bloqueia.
- `ajustar-conversor` — o desenho serve e a COR estragou na conversão. A lista
  `somente` vai para a especificação da folha e o conversor roda de novo.
  Não custa crédito.
- `refazer` — sai do jogo (`veredito.json`, lido por icones_consolidar.py) e
  entra na fila `_referencias/icones/lote/fila-refazer.json` com a descrição
  nova que o chefe escreveu.

`--montar-refacao` esvazia a fila em folhas `refazer-NN`, no mesmo formato
das folhas do catálogo, prontas para o gerador.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
LOTE = AQUI.parents[1] / '_referencias' / 'icones' / 'lote'
FILA = LOTE / 'fila-refazer.json'


def ler(p, padrao):
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else padrao


def aplicar(pasta, arquivo):
    final = json.loads(Path(arquivo).read_text(encoding='utf-8'))
    final = final.get('final', final)
    esp = json.loads((pasta / 'especificacao.json').read_text(encoding='utf-8'))
    por_id = {e['prefixo'] + e['id']: e for e in esp.get('entradas', [])}
    fila = ler(FILA, [])
    na_fila = {x['chave'] for x in fila}
    refazer, ressalvas, ajustou = [], {}, False
    for v in final['icones']:
        k, ver = v['id'], v['veredito']
        if ver == 'refazer':
            refazer.append(k)
            if k not in na_fila and k in por_id:
                item = dict(por_id[k])
                item['conceito'] = v.get('nova_descricao') or item['conceito']
                fila.append({'chave': k, 'motivo': v['motivo'], 'entrada': item})
        elif ver == 'aceitar-com-ressalva':
            ressalvas[k] = v['motivo']
        elif ver == 'ajustar-conversor' and v.get('somente'):
            for it in esp['icones']:
                if it[0] == k:
                    it[2:] = [{'somente': v['somente']}]
                    ajustou = True
    (pasta / 'veredito.json').write_text(json.dumps({'refazer': refazer}, indent=1, ensure_ascii=False), encoding='utf-8')
    (pasta / 'ressalvas.json').write_text(json.dumps(ressalvas, indent=1, ensure_ascii=False), encoding='utf-8')
    FILA.write_text(json.dumps(fila, indent=1, ensure_ascii=False), encoding='utf-8')
    if ajustou:
        (pasta / 'especificacao.json').write_text(json.dumps(esp, indent=1, ensure_ascii=False), encoding='utf-8')
        subprocess.run([sys.executable, str(AQUI / 'icones_prancha.py'), str(pasta)], check=True)
    print(f'{pasta.name}: {len(refazer)} para refazer, {len(ressalvas)} com ressalva, '
          f'ajuste de conversor: {"sim" if ajustou else "não"} | fila: {len(fila)}')


def montar_refacao(por_folha):
    sys.path.insert(0, str(AQUI))
    lote = __import__('icones_lote')
    colunas, linhas = lote.GRADES[por_folha]
    fila = ler(FILA, [])
    existentes = sorted(LOTE.glob('refazer-*'))
    base = len(existentes)
    for k in range(0, len(fila), por_folha):
        itens = [x['entrada'] for x in fila[k:k + por_folha]]
        pasta = LOTE / f'refazer-{base + k // por_folha + 1:02d}'
        pasta.mkdir(exist_ok=True)
        esp = {'paleta': lote.PALETA, 'colunas': colunas, 'linhas': linhas,
               'icones': [[x['prefixo'] + x['id'], x['conceito']] for x in itens], 'entradas': itens}
        (pasta / 'especificacao.json').write_text(json.dumps(esp, indent=1, ensure_ascii=False), encoding='utf-8')
        (pasta / 'prompt.txt').write_text(lote.prompt(itens, colunas, linhas), encoding='utf-8')
        print(f'{pasta.name}: {len(itens)} ícones')
    FILA.write_text('[]', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pasta', nargs='?')
    ap.add_argument('veredito', nargs='?')
    ap.add_argument('--montar-refacao', action='store_true')
    ap.add_argument('--por-folha', type=int, default=24)
    a = ap.parse_args()
    if a.montar_refacao:
        montar_refacao(a.por_folha)
    else:
        aplicar(Path(a.pasta), a.veredito)


if __name__ == '__main__':
    main()
