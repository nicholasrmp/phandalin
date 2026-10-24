# Gera `src/game/poco.js`: o terreno, a altura e as marcas do Poço da Coruja
# Velha (Parte 3 da aventura).
#
#   python src/dev/mapa-poco.py
#
# O livro nao traz mapa deste lugar ("crie um seu usando o texto"). Os FATOS
# sao dele: uma torre de vigia em ruinas no alto de um cume, os muros reduzidos
# a montes de entulho em volta de um patio, a base quebrada da torre colada no
# patio, um poco velho de agua limpa, uma tenda colorida no meio, e entrada
# por qualquer lado -- pelo caminho antigo ou por uma brecha nos escombros. O
# TRACADO e nosso. 1 casa = 1,5 m.
#
# Alturas (um nivel = 1,5 m): o alto do cume no nivel 1; a encosta do sul,
# por onde o grupo chega, no 0. O entulho dos muros fica um nivel acima do
# patio (escala-se, devagar); as paredes que sobraram da torre, dois.
#
# Glifos: , capim · : caminho batido · r pedra · b moita · x entulho do muro
# (terreno dificil) · M parede da torre · L piso da torre · n tenda · q poco.
W, H = 26, 22
T = [[','] * W for _ in range(H)]
A = [[1] * W for _ in range(H)]

R = lambda a, b: range(a, b + 1)


def casa(x, y, g, h=None):
    T[y][x] = g
    if h is not None:
        A[y][x] = h


# A encosta do sul, por onde se chega.
for y in R(19, 21):
    for x in range(W):
        A[y][x] = 0
# O caminho antigo: sobe a encosta e entra pelo portao do sul.
for y in R(17, 21):
    casa(12, y, ':'); casa(13, y, ':')
for y in R(11, 16):
    casa(12, y, ':')

# O muro em ruinas: um anel de entulho em volta do patio.
for x in R(5, 20):
    casa(x, 4, 'x', 2); casa(x, 17, 'x', 2)
for y in R(4, 17):
    casa(5, y, 'x', 2); casa(20, y, 'x', 2)
# O portao do sul (o caminho) e duas brechas: oeste e leste.
for x in (12, 13):
    casa(x, 17, ':', 1)
casa(5, 10, ',', 1)
casa(20, 13, ',', 1); casa(20, 14, ',', 1)

# A base da torre, no canto nordeste do patio: o que sobrou das paredes, e
# uma porta sem porta virada para o patio. Dentro, o escuro dos zumbis.
for x in R(14, 20):
    casa(x, 4, 'M', 3); casa(x, 10, 'M', 3)
for y in R(4, 10):
    casa(14, y, 'M', 3); casa(20, y, 'M', 3)
for y in R(5, 9):
    for x in R(15, 19):
        casa(x, y, 'L', 1)
PORTA = (14, 7)
casa(*PORTA, 'L', 1)

# A tenda do mago, 2 x 2, no meio do patio; a entrada dela olha para o sul.
for (x, y) in ((8, 9), (9, 9), (8, 10), (9, 10)):
    casa(x, y, 'n')
# O poco velho, perto da torre.
POCO = (11, 6)
casa(*POCO, 'q')

# Pedras e moitas no alto do cume e na encosta, para quem chega se esconder.
for (x, y) in ((2, 3), (23, 2), (1, 13), (24, 11), (3, 19), (22, 20), (8, 20), (17, 19)):
    casa(x, y, 'r')
for (x, y) in ((3, 8), (23, 7), (2, 16), (24, 17), (6, 20), (19, 21), (10, 2), (16, 1)):
    casa(x, y, 'b')
# Dentro do patio: um monte de pedra caida da torre e um caixote do mago.
casa(16, 13, 'r'); casa(7, 14, 'b')

# ---------------------------------------------------------------- saida ----
import json
from pathlib import Path

cab = '''// O POÇO DA CORUJA VELHA (Parte 3): a torre de vigia em ruínas no cume.
//
// Gerado por `src/dev/mapa-poco.py` — mude lá e rode de novo.
//
// Glifos: , capim · : caminho · r pedra · b moita · x entulho do muro ·
// M parede da torre · L piso da torre · n tenda · q poço. Alturas em dígitos
// (um nível = 1,5 m).
'''
dados = {
    'terreno': [''.join(l) for l in T],
    'altura': [''.join(str(v) for v in l) for l in A],
}
extra = {
    'porta': {'x': PORTA[0], 'y': PORTA[1]},
    'poco': {'x': POCO[0], 'y': POCO[1]},
    'tenda': [{'x': x, 'y': y} for (x, y) in ((8, 9), (9, 9), (8, 10), (9, 10))],
    'torre': {'x0': 15, 'y0': 5, 'x1': 19, 'y1': 9},
    'patio': {'x0': 6, 'y0': 5, 'x1': 19, 'y1': 16},
    'saida': [{'x': 12, 'y': 21}, {'x': 13, 'y': 21}],
}
saida = Path(__file__).resolve().parents[1] / 'game' / 'poco.js'
saida.write_text(
    cab + '\nexport const MAPA_POCO = ' + json.dumps(dados, indent=2, ensure_ascii=False) + ';\n\n'
    + 'export const POCO = ' + json.dumps(extra, indent=2, ensure_ascii=False) + ';\n',
    encoding='utf-8', newline='\n')
print('\n'.join(dados['terreno']))
