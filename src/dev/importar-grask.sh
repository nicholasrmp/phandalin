#!/usr/bin/env bash
# Importa as folhas do Grask com os nomes que o registro entende:
# grask-<armadura>-<arma>[~furia] (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: machado grande (a base), duas machadinhas,
# azagaia, espada grande e malho; sem armadura (a Defesa sem Armadura) e
# gibao de peles (edicao `grask-armadura-peles`). Cada folha tem a gemea em
# FURIA, com a aura vermelha de `src/dev/reskins-grask.py`. O oeste e
# espelhado do leste; so as folhas de duas maos tem queda propria -- as
# outras usam a queda sem arma.
#
# Uso: bash src/dev/importar-grask.sh
set -eu
R=_referencias/pixellab
G=$R/barbarian-72043e3a
M=$R/barbarianMachadinhas-8bfd64b5
A=$R/barbarianAzagaia-b6ee6f5b
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "grask-$nome" --espelho "$@" \
    | grep -E "KB" || true
}
FONTES=()
for ARM in roupa peles; do
  K=""; [ $ARM = peles ] && K="-grask-armadura-peles"
  FONTES+=("$G/anim$K" "$G/anim-grask-arma-espada-grande$K" "$G/anim-grask-arma-malho$K"
           "$G/anim-grask-queda-sem-arma$K" "$M/anim$K" "$A/anim$K")
done
# A espada grande e o malho sairam da edicao do machado numa janela de 80 px
# dentro da celula de 92: o machado que passava da janela ficou em pedacos
# soltos. Fora o que encosta no corpo, eles saem.
for ARM_K in "" "-grask-armadura-peles"; do
  for W in espada-grande malho; do
    python src/dev/limpar-soltos.py --fonte "$G/anim-grask-arma-$W$ARM_K" --perfil barbarian       --direcoes south,south-east,east,north-east,north --maximo 90 > /dev/null
  done
done
# As marcas vermelhas que o modelo pintou no corpo durante o golpe saem; a
# faixa de pintura do rosto fica (src/dev/limpar-vermelho.py).
python src/dev/limpar-vermelho.py "${FONTES[@]}" > /dev/null
python src/dev/reskins-grask.py "${FONTES[@]}" > /dev/null
for ARM in roupa peles; do
  K=""; [ $ARM = peles ] && K="-grask-armadura-peles"
  for F in "" "-furia"; do
    E=""; [ -n "$F" ] && E="~furia"
    Q="$G/anim-grask-queda-sem-arma$K$F"
    imp $G/anim$K$F barbarian $ARM-machado-grande$E
    imp $G/anim-grask-arma-espada-grande$K$F barbarian $ARM-espada-grande$E
    imp $G/anim-grask-arma-malho$K$F barbarian $ARM-malho$E
    imp $M/anim$K$F barbarianMachadinhas $ARM-machadinhas$E --queda-de "$Q"
    imp $A/anim$K$F barbarianAzagaia $ARM-azagaia$E --queda-de "$Q"
  done
done
