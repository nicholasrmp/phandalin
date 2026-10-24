# -*- coding: utf-8 -*-
"""
Aplica a escolha final do revisor-chefe: para cada ícone, QUAL versão fica.

    python src/dev/icones_escolha.py <escolha.json>

Quando o crédito acaba, um ícone que falhou em várias rodadas não vai para
refação de novo: o chefe escolhe a melhor versão que já existe (a pasta),
opcionalmente com `somente`/`contorno` para reconverter a cor. O PNG
escolhido é copiado para `refazer-zz-manual/embarcado/`, que a consolidação
lê por último — ganha de todas as outras versões, inclusive das reprovadas.
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
LOTE = AQUI.parents[1] / '_referencias' / 'icones' / 'lote'
MANUAL = LOTE / 'refazer-zz-manual' / 'embarcado'


def main(arquivo):
    escolha = json.loads(Path(arquivo).read_text(encoding='utf-8'))
    MANUAL.mkdir(parents=True, exist_ok=True)
    por_pasta = {}
    for chave, e in escolha.items():
        por_pasta.setdefault(e['pasta'], []).append((chave, e))
    amb = dict(os.environ, PYTHONUTF8='1')
    for pasta, itens in por_pasta.items():
        d = LOTE / pasta
        esp_f = d / 'especificacao.json'
        esp = json.loads(esp_f.read_text(encoding='utf-8'))
        mudou = False
        for chave, e in itens:
            opcoes = {k: e[k] for k in ('somente', 'contorno') if e.get(k)}
            if opcoes:
                for it in esp['icones']:
                    if it[0] == chave:
                        it[2:] = [opcoes]
                        mudou = True
        if mudou:
            esp_f.write_text(json.dumps(esp, indent=1, ensure_ascii=False), encoding='utf-8')
            subprocess.run([sys.executable, str(AQUI / 'icones_prancha.py'), str(d)], check=True, env=amb)
        for chave, _ in itens:
            shutil.copy(d / 'embarcado' / f'{chave}.png', MANUAL / f'{chave}.png')
            print(f'{chave:34} <- {pasta}')


if __name__ == '__main__':
    main(sys.argv[1])
