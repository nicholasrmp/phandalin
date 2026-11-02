# Gera `src/game/casadamorte-porao.js`: as plantas das duas MASMORRAS da Casa da Morte (Maldição de Strahd, Apêndice B, áreas 22 a 38).
#
#   python src/dev/mapa-casadamorte.py
#
# A ESCALA: o mapa do livro diz "One square = 5 feet" (1,5 m), ou seja, UM QUADRADO = UMA CASA do jogo, nas duas masmorras. As plantas são
# escritas direto em casas, com a rocha das paredes ocupando uma casa. Os tamanhos das salas vêm da grade desenhada no próprio mapa (a imagem
# fica em `_referencias/`, fora do repositório): a câmara do ritual (38) tem 12 m de lado = 8 x 8 casas, como diz o texto.
#
# A planta é um RASCUNHO fiel à topologia do livro (quem liga a quem, onde está cada sala com algo marcado) e não ao pixel da referência:
# os corredores do mapa original são labirínticos, e aqui só entram os que levam a alguma sala. Os glifos são os do jogo; rocha em volta,
# terra socada (`+`) no piso. A mobília usa os glifos que já existem (leito, baú, mesa, laje, altar), até a arte própria chegar.
import json
from pathlib import Path

SAIDA = Path(__file__).resolve().parents[2] / 'src' / 'game' / 'casadamorte-porao.js'


class Planta:
    def __init__(self, cols, rows, esc=2):
        self.esc = esc
        self.cols, self.rows = cols * esc, rows * esc
        self.t = [['R'] * self.cols for _ in range(self.rows)]       # terreno: R rocha
        self.h = [['3'] * self.cols for _ in range(self.rows)]       # altura: 3 na rocha, 0 no piso
        self.areas = []

    def cel(self, c0, r0, c1, r1):
        """Um retângulo de QUADRADOS (inclusivo) vira o retângulo de casas (com esc=1 são a mesma coisa)."""
        e = self.esc
        return (c0 * e, r0 * e, c1 * e + e - 1, r1 * e + e - 1)

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
# Áreas 22 a 34, em CASAS (1 quadrado do livro = 1 casa; a rocha das paredes ocupa uma casa). 25 colunas x 26 linhas. Norte em cima.
# Os tamanhos das salas vêm da grade desenhada no mapa do livro: o salão do poço (25) tem 5 x 5, o dos iniciados (24) 4 x 5, o de jantar (27)
# 4 x 3, o santuário (31) 3 x 5 com a abside, o covil (33) e o quarto dos líderes (34) 3 x 3; os corredores têm 1 casa.
P1 = Planta(25, 26, esc=1)

# --- o oeste: o salão do poço (25) e os cinco quartos de cultista (A a E).
P1.piso(2, 7, 7, 11)                                   # o salão do poço, com a espinha de pilares
P1.sala('poco', '25', 'O poço e os quartos dos cultistas', 1, 4, 7, 14)
P1.piso(1, 8, 1, 10)                                   # o quarto C, aberto para o salão
P1.piso(1, 4, 2, 5); P1.piso(2, 6, 2, 6)               # o quarto B e a porta dele
P1.piso(4, 4, 5, 5); P1.piso(4, 6, 4, 6)               # o quarto A
P1.piso(2, 13, 3, 14); P1.piso(2, 12, 2, 12)           # o quarto D
P1.piso(5, 13, 6, 14); P1.piso(5, 12, 5, 12)           # o quarto E
# --- a escadinha (7, 2..6) que sobe do canto do salão até o salão dos iniciados.
P1.piso(7, 2, 7, 6)
# --- o salão dos iniciados (24): a parte de cima (3 x 2, com a mesa) e o salão (4 x 5), com as camas de palha.
P1.piso(10, 0, 12, 1)
P1.piso(9, 2, 12, 6)
P1.piso(8, 2, 8, 2)                                    # a porta do oeste, para a escadinha
P1.sala('iniciados', '24', 'O quarto dos iniciados', 9, 0, 12, 6)
# --- o corredor de cima: do salão dos iniciados até a espinha leste (que desce até o jantar), e o canto da escada em espiral (22).
P1.piso(13, 1, 17, 1)
P1.piso(17, 1, 17, 9)
P1.piso(14, 3, 16, 3)
P1.sala('acesso', '22', 'O acesso à masmorra', 14, 3, 16, 3)
# --- as criptas (23): A e B no alto, E e F a oeste da espinha, C e D a leste. Cada uma tem 2 casas e o sarcófago na ponta de dentro.
CRIPTAS = {
    'criptaA': ('23A', 'A cripta vazia', (22, 1, 23, 1)),
    'criptaB': ('23B', 'A cripta de Walter', (22, 3, 23, 3)),
    'criptaC': ('23C', 'A cripta de Gustav', (19, 5, 20, 5)),
    'criptaD': ('23D', 'A cripta de Elisabeth', (19, 8, 20, 8)),
    'criptaE': ('23E', 'A cripta de Rose', (14, 5, 15, 5)),
    'criptaF': ('23F', 'A cripta de Thorn', (14, 8, 15, 8)),
}
P1.piso(18, 2, 21, 2); P1.piso(21, 1, 21, 3)           # o corredor curto até A e B
for id_, (area, nome, (x0, y0, x1, y1)) in CRIPTAS.items():
    P1.piso(x0, y0, x1, y1)
    P1.sala(id_, area, nome, x0, y0, x1, y1)
# As lajes que SELAM as criptas C, D, E e F: parede até alguém afastá-las. A cripta D (23D) não tem parede para o jantar.
for (x, y) in [(18, 5), (18, 8), (16, 5), (16, 8)]:
    P1.casa(x, y, 'M')
# Os sarcófagos (Q): na ponta de dentro de cada cripta.
for (x, y) in [(23, 1), (23, 3), (20, 5), (20, 8), (14, 5), (14, 8)]:
    P1.casa(x, y, 'Q')
# --- o corredor leste-oeste (do salão do poço até o jantar), e o túnel do poço de espinhos (26) que desce até a escada (30).
P1.piso(8, 11, 15, 11)
P1.piso(11, 12, 11, 19)
P1.sala('espinhos', '26', 'O túnel do poço de espinhos', 11, 12, 11, 14)
P1.piso(10, 16, 10, 19); P1.piso(12, 19, 12, 19)
P1.sala('escadas', '30', 'A escada para baixo', 10, 16, 12, 19)
for (x, y) in [(10, 16), (10, 17)]:
    P1.casa(x, y, 'l')
# --- o salão de jantar (27): 4 x 3, com a mesa comprida, e a despensa do grick (28) na parede leste.
P1.piso(16, 10, 19, 12)
P1.sala('jantar', '27', 'O salão de jantar do culto', 16, 10, 19, 12)
P1.piso(20, 10, 20, 10)
P1.sala('despensa', '28', 'A despensa', 20, 10, 20, 10)
# --- o cruzamento de quatro vias (29) e a espinha sul, que desce do jantar até o covil; o corredor leste vai ao santuário.
P1.piso(16, 13, 16, 19)
P1.piso(11, 15, 18, 15)
P1.sala('carnicais', '29', 'O cruzamento das quatro vias', 16, 14, 16, 16)
# --- o santuário do Senhor Negro (31): 3 x 5, a abside redonda a leste com a estátua, e a escada do alçapão (32) ao norte.
P1.piso(19, 15, 21, 19)
P1.piso(22, 16, 22, 19); P1.piso(23, 17, 23, 18)
P1.sala('santuario', '31', 'O santuário do Senhor Negro', 19, 15, 23, 19)
P1.piso(21, 10, 21, 13)
P1.sala('alcapao', '32', 'A escada do alçapão', 21, 10, 21, 13)
P1.casa(21, 12, 'l'); P1.casa(21, 13, 'l')
P1.casa(21, 14, 'M')                                   # a porta escondida, na parede norte do santuário
# --- o covil dos líderes do culto (33), 3 x 3, e o quarto dos líderes (34), 3 x 3, ligados pela porta do canto (o mímico).
P1.piso(16, 20, 18, 22)
P1.piso(19, 20, 19, 20)                                # a porta do canto sudoeste do covil para o santuário: o mímico
P1.sala('covil', '33', 'O covil dos líderes do culto', 16, 20, 18, 22)
P1.piso(12, 21, 14, 23)
P1.piso(15, 22, 15, 22)
P1.piso(13, 20, 13, 20); P1.piso(11, 22, 11, 22)       # as cavidades dos lívidos (as marcas X do livro)
P1.sala('quartoLideres', '34', 'O quarto dos líderes do culto', 12, 21, 14, 23)

# --- a mobília (casas do jogo)
P1.casa(19, 20, '?')                                   # a porta do canto sudoeste do covil, que é um mímico
P1.casa(11, 1, 'm')                                    # a mesa dos iniciados
for (x, y) in [(9, 4), (9, 5), (12, 3), (12, 4), (10, 6), (11, 6)]:
    P1.casa(x, y, 'p')                                 # as camas de palha
P1.casa(14, 3, 'l')                                    # a espiral que sobe ao sótão (21)
P1.casa(4, 9, 'q')                                     # o poço
for (x, y, bx, by) in [(1, 4, 2, 4), (5, 4, 4, 4), (1, 8, 1, 10), (2, 14, 3, 14), (6, 14, 5, 14)]:
    P1.casa(x, y, 'z'); P1.casa(bx, by, 'K')           # cinco leitos com baú (A a E)
for x in (17, 18):
    P1.casa(x, 11, 'm')                                # a mesa comprida do jantar
P1.casa(23, 17, 'a')                                   # a estátua de Strahd, no nicho redondo
for (x, y) in [(20, 16), (20, 18)]:
    P1.casa(x, y, 'A')                                 # estalagmites no santuário: cobertura
for y in (16, 17, 18):
    P1.casa(19, y, 'c')                                # os esqueletos nas correntes, junto à parede oeste
P1.casa(17, 21, 'm')                                    # a mesa do covil, no meio da sala
P1.casa(13, 23, 'D'); P1.casa(14, 23, 'D')             # a cama grande
P1.casa(12, 21, 'K')                                   # o baú dos líderes
PLANTA_1 = P1.linhas() + (P1.areas,)

# ================================================================================================================ NÍVEL 2 ====
# Áreas 35 a 38, em CASAS (1 quadrado do livro = 1 casa; a rocha das paredes ocupa uma casa). 15 colunas x 20 linhas. Norte em cima.
P2 = Planta(15, 20, esc=1)

# A escada que vem do nível 1 (30): o corredor oeste, que desce até a junção com a prisão e com o relicário.
P2.piso(1, 1, 2, 1)
P2.piso(1, 1, 1, 6)
P2.sala('escadaChegada', '30', 'A escada que desce', 1, 1, 1, 6)
for y in (3, 4):
    P2.casa(1, y, 'l')
# O relicário (35): sala de pilares, 5 x 3, com treze nichos nas paredes.
P2.piso(3, 1, 7, 3)
P2.sala('relicario', '35', 'O relicário', 3, 1, 7, 3)
# O corredor do relicário até a prisão.
P2.piso(3, 4, 3, 6)
P2.piso(1, 6, 3, 6)
# O túnel que desce do relicário para a água (35), e a ponte levadiça (37) na entrada da câmara.
P2.piso(6, 4, 6, 4)
P2.piso(6, 5, 6, 5, 'w', '0')
P2.sala('tunelAgua', '35', 'O túnel que desce para a água', 6, 4, 6, 5)
P2.piso(6, 6, 6, 7, '=', '1')
P2.sala('ponte', '37', 'A ponte levadiça', 6, 6, 6, 7)
# A prisão (36): o corredor do meio e quatro celas de cada lado.
P2.piso(2, 7, 2, 14)
for y in (8, 10, 12, 14):
    P2.piso(1, y, 1, y)
    P2.piso(3, y, 3, y)
P2.sala('prisao', '36', 'A prisão', 1, 7, 3, 14)
# A câmara do ritual (38): salão afundado de 12 m de lado (8 x 8 casas), bordas de pedra a 1,5 m junto às paredes, água a 60 cm e o estrado octogonal
# no meio, a 1,5 m. A coluna 4 é a parede entre a prisão e a câmara (a porta secreta).
P2.piso(5, 8, 12, 15, 'L', '1')        # o anel de pedra
P2.piso(6, 9, 11, 14, 'w', '0')        # a água (60 cm)
P2.sala('camara', '38', 'A câmara do ritual', 5, 8, 12, 15)
# O estrado octogonal: 4 x 4 casas sem os cantos, no meio da água; o altar de pedra ocupa duas casas no centro.
for y in range(10, 14):
    for x in range(7, 11):
        if (x in (7, 10)) and (y in (10, 13)):
            continue
        P2.casa(x, y, 'L', '1')
P2.casa(8, 11, 'a', '1'); P2.casa(9, 11, 'a', '1')
# Os pilares nos cantos da água (cobertura, e o livro os desenha ali).
for (x, y) in [(6, 9), (11, 9), (6, 14), (11, 14)]:
    P2.casa(x, y, 'r', '3')
# A alcova do arbusto errante: uma abertura de duas casas na parede do fundo da câmara.
P2.piso(7, 16, 8, 16, 'w', '0')
P2.piso(7, 17, 8, 18)
P2.sala('alcova', '38', 'A alcova do lixo', 7, 16, 8, 18)

# A ponte levadiça (37): erguida, fecha o túnel que sai do relicário até a câmara.
for y in (6, 7):
    P2.casa(6, y, 'M')
# A porta secreta da prisão para a câmara: uma casa de parede que se abre.
P2.casa(4, 10, 'M')
# Pedras de cobertura no relicário (os pilares).
for (x, y) in [(4, 2), (6, 2)]:
    P2.casa(x, y, 'r', '3')
PLANTA_2 = P2.linhas() + (P2.areas,)


def js(nome, planta):
    t, h, areas = planta
    return (f"export const {nome} = {{\n  terreno: {json.dumps(t, ensure_ascii=False, indent=2)},\n"
            f"  altura: {json.dumps(h, ensure_ascii=False, indent=2)},\n"
            f"  areas: {json.dumps(areas, ensure_ascii=False, indent=2)},\n}};\n")


cabecalho = ("// Gerado por `src/dev/mapa-casadamorte.py` — mude lá e rode de novo.\n"
             "// As duas masmorras da Casa da Morte (áreas 22 a 38). Cada quadrado do mapa de referência é uma casa.\n\n")
SAIDA.write_text(cabecalho + js('PLANTA_PORAO_1', PLANTA_1) + '\n' + js('PLANTA_PORAO_2', PLANTA_2), encoding='utf-8')
print('ok', SAIDA, P1.cols, P1.rows, P2.cols, P2.rows)
