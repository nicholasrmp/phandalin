# Gera `src/game/casadamorte-porao.js`: as plantas das duas MASMORRAS da Casa da Morte (Maldição de Strahd, Apêndice B, áreas 22 a 38).
#
#   python src/dev/mapa-casadamorte.py
#
# A ESCALA (decisão do dono): nas masmorras, cada QUADRADO DO MAPA vale 2 x 2 casas do jogo (10 pés = 3 m = 2 casas de 1,5 m). Por isso as
# salas e corredores abaixo são escritos em QUADRADOS do mapa de referência (a imagem fica em `_referencias/`, fora do repositório, e só dá a
# ORGANIZAÇÃO) e o script os multiplica por 2 em cada eixo. O mapa de nível 1 tem 18 x 20 quadrados = 36 x 40 casas; o de nível 2, 22 x 30
# quadrados = 44 x 60 casas.
#
# A planta é um RASCUNHO fiel à topologia do livro (quem liga a quem, onde está cada sala com algo marcado) e não ao pixel da referência:
# os corredores do mapa original são labirínticos, e aqui só entram os que levam a alguma sala. Os glifos são os do jogo; rocha em volta,
# terra socada (`+`) no piso. A mobília usa os glifos que já existem (leito, baú, mesa, laje, altar), até a arte própria chegar.
import json
from pathlib import Path

SAIDA = Path(__file__).resolve().parents[2] / 'src' / 'game' / 'casadamorte-porao.js'


class Planta:
    def __init__(self, cols, rows):
        self.cols, self.rows = cols * 2, rows * 2
        self.t = [['R'] * self.cols for _ in range(self.rows)]       # terreno: R rocha
        self.h = [['3'] * self.cols for _ in range(self.rows)]       # altura: 3 na rocha, 0 no piso
        self.areas = []

    def cel(self, c0, r0, c1, r1):
        """Um retângulo de QUADRADOS (inclusivo) vira o retângulo de casas."""
        return (c0 * 2, r0 * 2, c1 * 2 + 1, r1 * 2 + 1)

    def piso(self, c0, r0, c1, r1, g='+', alt='0'):
        x0, y0, x1, y1 = self.cel(c0, r0, c1, r1)
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.t[y][x] = g
                self.h[y][x] = alt

    def casa(self, x, y, g, alt=None):
        """Uma casa solta, em coordenadas de CASA (não de quadrado)."""
        self.t[y][x] = g
        if alt is not None:
            self.h[y][x] = alt

    def sala(self, id, area, nome, c0, r0, c1, r1):
        x0, y0, x1, y1 = self.cel(c0, r0, c1, r1)
        self.areas.append({'id': id, 'area': area, 'nome': nome, 'x1': x0, 'y1': y0, 'x2': x1, 'y2': y1})

    def linhas(self):
        return [''.join(l) for l in self.t], [''.join(l) for l in self.h]


# ================================================================================================================ NÍVEL 1 ====
# Áreas 22 a 34. Em quadrados: 18 colunas x 20 linhas.
P1 = Planta(20, 20)

# A espinha norte-sul (22, a chegada da escada em espiral do sótão; os cruzamentos 29 e as criptas ficam ao longo dela).
P1.piso(11, 0, 11, 8)
P1.sala('acesso', '22', 'O acesso à masmorra', 11, 0, 11, 3)
# O salão dos iniciados (24), com a mesa e as quatro cadeiras, e as alcovas de palha a oeste. Ligado à espinha por um corredor.
P1.piso(6, 0, 8, 1)
P1.piso(4, 0, 5, 1)
P1.piso(9, 0, 10, 0)
P1.sala('iniciados', '24', 'O quarto dos iniciados', 4, 0, 8, 1)
# O poço e os quartos dos cultistas (25): o salão do poço com cinco nichos de cama e baú nos cantos.
P1.piso(1, 3, 5, 10)
P1.piso(0, 6, 0, 7)
P1.sala('poco', '25', 'O poço e os quartos dos cultistas', 0, 3, 5, 10)
# O corredor leste-oeste (r8): do salão do poço até o cruzamento, com o poço de espinhos (26) no meio.
P1.piso(6, 8, 10, 8)
P1.sala('espinhos', '26', 'O túnel do poço de espinhos', 6, 8, 10, 8)
# O cruzamento de quatro vias (29), onde os carniçais se levantam.
P1.sala('carnicais', '29', 'O cruzamento das quatro vias', 11, 7, 11, 9)
# O salão de jantar do culto (27), com a despensa do grick (28) na parede sul.
P1.piso(12, 7, 15, 9)
P1.piso(14, 10, 14, 10)
P1.sala('jantar', '27', 'O salão de jantar do culto', 12, 7, 15, 9)
P1.sala('despensa', '28', 'A despensa', 14, 10, 14, 10)
# A espinha sul: do cruzamento até a escada para baixo (30), o santuário (31) e o covil (33).
P1.piso(11, 9, 11, 15)
P1.piso(7, 12, 10, 12)
P1.piso(7, 13, 8, 14)
P1.sala('escadas', '30', 'A escada para baixo', 7, 12, 10, 14)
# O santuário do Senhor Negro (31): sala grande, nicho redondo a leste com a estátua, saída oeste e norte.
P1.piso(13, 13, 16, 17)
P1.piso(17, 14, 17, 16)
P1.piso(12, 15, 12, 15)
P1.piso(15, 10, 15, 12)
P1.sala('santuario', '31', 'O santuário do Senhor Negro', 13, 13, 17, 17)
# O covil dos líderes do culto (33) e o quarto dos líderes (34).
P1.piso(10, 16, 12, 18)
P1.sala('covil', '33', 'O covil dos líderes do culto', 10, 16, 12, 18)
P1.piso(9, 17, 9, 17)
P1.piso(6, 17, 8, 19)
P1.piso(7, 16, 7, 16)
P1.piso(5, 18, 5, 18)
P1.sala('quartoLideres', '34', 'O quarto dos líderes do culto', 5, 16, 8, 19)
# As seis criptas familiares (23): salas de 2 x 1 quadrados ao longo da espinha norte, três de cada lado.
CRIPTAS = {
    'criptaA': ('23A', 'A cripta vazia', (9, 6, 10, 6)),
    'criptaF': ('23F', 'A cripta de Thorn', (9, 2, 10, 2)),
    'criptaE': ('23E', 'A cripta de Rose', (9, 4, 10, 4)),
    'criptaB': ('23B', 'A cripta de Walter', (12, 2, 13, 2)),
    'criptaC': ('23C', 'A cripta de Gustav', (12, 4, 13, 4)),
    'criptaD': ('23D', 'A cripta de Elisabeth', (12, 6, 13, 6)),
}
for id_, (area, nome, (c0, r0, c1, r1)) in CRIPTAS.items():
    P1.piso(c0, r0, c1, r1)
    P1.sala(id_, area, nome, c0, r0, c1, r1)

# --- a mobília (casas de jogo): cada cripta tem o sarcófago na ponta de dentro; as lajes de C, D, E e F fecham a entrada.
def cr(c, r, dx=0, dy=0):
    return c * 2 + dx, r * 2 + dy

# Sarcófagos (Q): na ponta de dentro de cada cripta (2 x 2 casas por quadrado).
for (c, r) in [(9, 6), (9, 2), (9, 4), (13, 2), (13, 4), (13, 6)]:
    x = c * 2 + (0 if c == 9 else 1)
    P1.casa(x, r * 2, 'Q'); P1.casa(x, r * 2 + 1, 'Q')
# As lajes que SELAM as criptas C, D (leste: a casa junto da espinha, x = 24) e E, F (oeste: x = 21): parede até alguém afastá-las.
for r in (2, 4):
    P1.casa(21, r * 2, 'M'); P1.casa(21, r * 2 + 1, 'M')
for r in (4, 6):
    P1.casa(24, r * 2, 'M'); P1.casa(24, r * 2 + 1, 'M')
P1.casa(24, 4 * 2, 'M'); P1.casa(24, 4 * 2 + 1, 'M')

# O quarto dos iniciados: mesa de 2 x 2 casas no meio, palha nas alcovas.
for (x, y) in [(14, 2), (15, 2), (14, 3), (15, 3)]:
    P1.casa(x, y, 'm')
for (x, y) in [(8, 0), (8, 1), (9, 0), (9, 1), (8, 2), (9, 2)]:
    P1.casa(x, y, 'p')
# O salão do poço: o poço (4,6 em quadrados = casas 8,12), cinco leitos com baú.
P1.casa(9, 12, 'q'); P1.casa(8, 12, 'q')
for (x, y, bx, by) in [(2, 6, 3, 6), (10, 6, 9, 6), (0, 12, 1, 12), (2, 20, 3, 20), (10, 20, 9, 20)]:
    P1.casa(x, y, 'z'); P1.casa(bx, by, 'K')
# O salão de jantar: mesa comprida e bancos.
for x in range(26, 31):
    P1.casa(x, 16, 'm'); P1.casa(x, 17, 'm')
# O santuário: a estátua de Strahd no nicho redondo (altar) e os esqueletos nas correntes (decoração: ossos).
P1.casa(35, 29, 'a')
for y in range(27, 35):
    P1.casa(26, y, 'c')
# O covil dos líderes: a mesa e as duas cadeiras; o quarto: a cama grande e o baú.
for (x, y) in [(22, 34), (23, 34), (22, 35), (23, 35)]:
    P1.casa(x, y, 'm')
P1.casa(14, 37, 'D'); P1.casa(15, 37, 'D'); P1.casa(14, 38, 'D'); P1.casa(15, 38, 'D')
P1.casa(11, 36, 'K')
# A escada para baixo (30): degraus em duas casas; a espiral do sótão (22) no topo da espinha.
for (x, y) in [(14, 26), (15, 26), (14, 27), (15, 27), (16, 26), (17, 26)]:
    P1.casa(x, y, 'l')
for (x, y) in [(22, 0), (23, 0), (22, 1), (23, 1)]:
    P1.casa(x, y, 'l')                       # a espiral que sobe ao sótão (21)
# O alçapão oculto (32): uma porta escondida na parede leste do santuário (as duas casas de fora começam como parede) e uma escada de pedra
# que sobe 3 m até o alçapão sob o canil.
P1.piso(18, 15, 19, 15)
P1.sala('alcapao', '32', 'A escada do alçapão', 18, 15, 19, 15)
for (x, y) in [(36, 30), (36, 31)]:
    P1.casa(x, y, 'M')
for (x, y) in [(38, 30), (39, 30), (38, 31), (39, 31)]:
    P1.casa(x, y, 'l')

P1.casa(19, 35, '?')                         # a porta do canto sudoeste do covil, que é um mímico
PLANTA_1 = P1.linhas() + (P1.areas,)

# ================================================================================================================ NÍVEL 2 ====
# Áreas 35 a 38. Em quadrados: 22 colunas x 30 linhas.
P2 = Planta(22, 30)

# A escada que vem do nível 1 (30) e o corredor até o relicário (35).
P2.piso(0, 5, 1, 8)
P2.piso(0, 1, 1, 5)
P2.piso(0, 0, 3, 1)
P2.sala('escadaChegada', '30', 'A escada que desce', 0, 5, 1, 8)
# O relicário (35): sala grande de pilares, com treze nichos nas paredes.
P2.piso(3, 0, 14, 7)
P2.sala('relicario', '35', 'O relicário', 0, 0, 14, 7)
# O túnel que desce do relicário para a água (e a ponte levadiça, 37).
P2.piso(10, 8, 11, 9)
P2.sala('tunelAgua', '35', 'O túnel que desce para a água', 10, 8, 11, 9)
# A prisão (36): o bloco oeste, de celas, ligado à escada por um corredor.
P2.piso(2, 8, 3, 9)
P2.piso(0, 10, 5, 24)
P2.sala('prisao', '36', 'A prisão', 0, 10, 5, 24)
# A câmara do ritual (38): salão afundado (água de 60 cm), bordas de pedra a 1,5 m e o estrado octogonal no meio.
P2.piso(7, 10, 21, 25, 'L', '1')       # o anel de laje; a coluna 6 fica de rocha: é a parede entre a prisão e a câmara (a porta secreta)
P2.piso(8, 11, 20, 24, 'w', '0')       # a água (60 cm)
P2.sala('camara', '38', 'A câmara do ritual', 7, 10, 21, 25)
# O estrado octogonal: casas com |dx| + |dy| dentro do octógono, em casas de jogo, centro em (27, 35).
CX, CY, R = 28, 35, 9
for y in range(P2.rows):
    for x in range(P2.cols):
        dx, dy = abs(x - CX), abs(y - CY)
        if dx <= R and dy <= R and dx + dy <= int(R * 1.5):
            if P2.t[y][x] in ('w', 'L'):
                P2.casa(x, y, 'L', '1')
P2.casa(CX, CY, 'a', '1'); P2.casa(CX + 1, CY, 'a', '1')                 # o altar de pedra
# A ponte levadiça (37) e a alcova do arbusto errante.
P2.piso(10, 25, 11, 26, '=', '1')
P2.sala('ponte', '37', 'A ponte levadiça', 10, 25, 11, 26)
P2.piso(9, 27, 14, 29)
P2.sala('alcova', '38', 'A alcova do lixo', 9, 27, 14, 29)

# A escada que chega do nível 1 (dois degraus de largura, no canto de cima da esquerda).
for (x, y) in [(0, 10), (1, 10), (0, 11), (1, 11)]:
    P2.casa(x, y, 'l')
# A ponte levadiça (37): erguida, fecha o túnel que sai do relicário até a água da câmara.
for x in range(20, 24):
    for y in (18, 19):
        P2.casa(x, y, 'M')
# A porta secreta da prisão para a câmara (parede sul da prisão): duas casas de parede que se abrem.
for x in (12, 13):
    for y in (34, 35):
        P2.casa(x, y, 'M')
PLANTA_2 = P2.linhas() + (P2.areas,)


def js(nome, planta):
    t, h, areas = planta
    return (f"export const {nome} = {{\n  terreno: {json.dumps(t, ensure_ascii=False, indent=2)},\n"
            f"  altura: {json.dumps(h, ensure_ascii=False, indent=2)},\n"
            f"  areas: {json.dumps(areas, ensure_ascii=False, indent=2)},\n}};\n")


cabecalho = ("// Gerado por `src/dev/mapa-casadamorte.py` — mude lá e rode de novo.\n"
             "// As duas masmorras da Casa da Morte (áreas 22 a 38). Cada quadrado do mapa de referência vale 2 x 2 casas.\n\n")
SAIDA.write_text(cabecalho + js('PLANTA_PORAO_1', PLANTA_1) + '\n' + js('PLANTA_PORAO_2', PLANTA_2), encoding='utf-8')
print('ok', SAIDA, P1.cols, P1.rows, P2.cols, P2.rows)
