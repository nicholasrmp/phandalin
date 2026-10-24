#!/usr/bin/env bash
# Importa as folhas do Pip com os nomes que o registro entende:
# pip-<armadura>-<arma> (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: espada curta (a base), rapieira, duas adagas, duas
# espadas curtas, espada curta e adaga, arco curto e besta de mao; couro (a
# base) e couro batido (edicao `pip-armadura-couro-batido`). Capa de capuz
# levantado em tudo. O oeste e espelhado do leste; so a folha da espada curta
# tem queda propria -- as outras usam a queda sem arma.
#
# Uso: bash src/dev/importar-pip.sh   (antes: python src/dev/reskins-pip.py)
set -eu
R=_referencias/pixellab
P=$R/rogue-bd64b4ff
A=$R/rogueAdagas-3017fee5
AR=$R/rogueArco-d199eb86
BM=$R/rogueBestaDeMao-d048c58d
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "pip-$nome" --espelho "$@" \
    | grep -E "KB" || true
}
for ARM in couro couroBatido; do
  # de couro batido a capa e preta (src/dev/reskins-pip.py, sem geracoes)
  K=""; [ $ARM = couroBatido ] && K="-pip-armadura-couro-batido-capa-preta"
  Q="$P/anim-pip-queda-sem-arma$K"
  imp $P/anim$K rogue $ARM-espada
  imp $P/anim-pip-arma-rapieira$K rogue $ARM-rapieira
  imp $A/anim$K rogueAdagas $ARM-adagas --queda-de "$Q"
  imp $A/anim-pip-arma-espadas$K rogueAdagas $ARM-espadas --queda-de "$Q"
  imp $A/anim-pip-arma-espada-adaga$K rogueAdagas $ARM-espada-adaga --queda-de "$Q"
  imp $AR/anim$K rogueArco $ARM-arco --queda-de "$Q"
  imp $BM/anim$K rogueBestaDeMao $ARM-besta-de-mao --queda-de "$Q"
done
