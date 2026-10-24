#!/usr/bin/env bash
# Importa as folhas do Torvik com os nomes que o registro entende:
# torvik-<armadura>-<arma> (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: espada longa, martelo de guerra e maca com escudo;
# espada grande, azagaia, besta e arco. A base do PixelLab saiu de PLACAS; a
# cota de malha (a das regras, e a folha padrao) e a edicao
# `torvik-armadura-malha`, e a Dragonguard e o reskin das placas
# (`src/dev/reskins-torvik.py`). O oeste e espelhado do leste; as posturas sem
# escudo caem com a queda sem escudo.
#
# Uso: bash src/dev/importar-torvik.sh
set -eu
R=_referencias/pixellab
P=$R/paladin-fadc01a4
EG=$R/paladinEspadaGrande-d7032dc2
AZ=$R/paladinAzagaia-0e2aa4c2
BE=$R/paladinBesta-b0bb8cfb
AR=$R/paladinArco-348edb47
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "torvik-$nome" --espelho "$@" \
    | grep -E "KB" || true
}
# a espada grande deixou um pedaco da espada longa solto ao lado da cabeca
for F in "$EG/anim" "$EG/anim-torvik-armadura-malha"; do
  python src/dev/limpar-soltos.py --fonte "$F" --perfil paladinEspadaGrande     --direcoes south,south-east,east,north-east,north --maximo 45 > /dev/null
done
python src/dev/reskins-torvik.py   "$P/anim" "$P/anim-torvik-armadura-malha" "$P/anim-torvik-arma-martelo" "$P/anim-torvik-arma-martelo-torvik-armadura-malha"   "$P/anim-torvik-arma-maca" "$P/anim-torvik-arma-maca-torvik-armadura-malha"   "$P/anim-torvik-queda-sem-escudo" "$P/anim-torvik-queda-sem-escudo-torvik-armadura-malha"   "$EG/anim" "$EG/anim-torvik-armadura-malha" "$AZ/anim" "$AZ/anim-torvik-armadura-malha" "$BE/anim" "$BE/anim-torvik-armadura-malha" "$AR/anim" "$AR/anim-torvik-armadura-malha" > /dev/null
for ARM in placas malha dragonguard; do
  K=""
  [ $ARM = malha ] && K="-torvik-armadura-malha"
  [ $ARM = dragonguard ] && K="-dragonguard"
  Q="$P/anim-torvik-queda-sem-escudo$K"
  imp $P/anim$K paladin $ARM-espada-escudo
  imp $P/anim-torvik-arma-martelo$K paladin $ARM-martelo-escudo
  imp $P/anim-torvik-arma-maca$K paladin $ARM-maca-escudo
  imp $EG/anim$K paladinEspadaGrande $ARM-espada-grande --queda-de "$Q"
  imp $AZ/anim$K paladinAzagaia $ARM-azagaia --queda-de "$Q"
  imp $BE/anim$K paladinBesta $ARM-besta --queda-de "$Q"
  imp $AR/anim$K paladinArco $ARM-arco --queda-de "$Q"
done
