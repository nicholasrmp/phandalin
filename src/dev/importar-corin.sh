#!/usr/bin/env bash
# Importa as folhas do Corin com os nomes que o registro entende:
# corin-<armadura>-<arma> (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: espada longa (a base), duas espadas curtas e arco
# longo; couro (a base), couro batido e camisao de malha, por edicao
# (`corin-armadura-*`). O oeste e espelhado do leste; as posturas sem a
# espada longa caem com a queda sem arma.
#
# Uso: bash src/dev/importar-corin.sh
set -eu
R=_referencias/pixellab
P=$R/ranger-0fd39be7
EP=$R/rangerEspadas-e8d27959
AR=$R/rangerArco-2b3aa62a
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "corin-$nome" --espelho "$@" \
    | grep -E "KB" || true
}
for ARM in couro couroBatido malha; do
  K=""
  [ $ARM = couroBatido ] && K="-corin-armadura-couro-batido"
  [ $ARM = malha ] && K="-corin-armadura-malha"
  Q="$P/anim-corin-queda-sem-arma$K"
  imp $P/anim$K ranger $ARM-espada
  imp $EP/anim$K rangerEspadas $ARM-espadas --queda-de "$Q"
  # a base do arco despiu as pernas a nordeste: o couro usa a copia vestida
  A=$AR/anim$K; [ $ARM = couro ] && A=$AR/anim-corin-calca
  imp $A rangerArco $ARM-arco --queda-de "$Q"
done
