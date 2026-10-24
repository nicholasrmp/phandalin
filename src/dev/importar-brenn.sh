#!/usr/bin/env bash
# Importa as folhas do Brenn com os nomes que o registro entende:
# brenn-<armadura>-<arma> (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: maca, martelo de guerra e Lightbringer com escudo,
# besta leve sem escudo; brunea (escamas, a base), malha e placas. As
# armaduras saem das edicoes `brenn-armadura-<nome>` de cada folha, so do lado
# leste -- dai o `--espelho` (o oeste da folha base tambem veio fraco).
# A besta cai no chao sem escudo: a queda dela vem da edicao
# `brenn-queda-sem-escudo` da folha de maca da mesma armadura.
#
# Uso: bash src/dev/importar-brenn.sh   (antes: python src/dev/reskins-brenn.py)
set -eu
R=_referencias/pixellab
C=$R/cleric-2e171ced
B=$R/clericBesta-2bafcbc5
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "brenn-$nome" --espelho "$@" \
    | grep -E "KB" || true
}
# De placas ele usa capacete: a edicao `brenn-capacete` por cima das placas.
for ARM in escamas malha placas; do
  S=""; K=""
  [ $ARM != escamas ] && S="-brenn-armadura-$ARM"
  [ $ARM = placas ] && K="-brenn-capacete"
  imp $C/anim$S$K cleric $ARM-maca-escudo
  imp $C/anim-brenn-arma-martelo$S$K cleric $ARM-martelo-escudo
  imp $C/anim$S$K-lightbringer cleric $ARM-lightbringer-escudo
  imp $B/anim$S$K clericBesta $ARM-besta --queda-de "$C/anim$S-brenn-queda-sem-escudo$K"
done
# A Dragonguard (src/dev/reskins-brenn.py): as placas com capacete em bronze.
ARM=dragonguard
P=-brenn-armadura-placas-brenn-capacete
D=-dragonguard
imp $C/anim$P$D cleric dragonguard-maca-escudo
imp $C/anim-brenn-arma-martelo$P$D cleric dragonguard-martelo-escudo
imp $C/anim$P-lightbringer$D cleric dragonguard-lightbringer-escudo
imp $B/anim$P$D clericBesta dragonguard-besta --queda-de "$C/anim-brenn-armadura-placas-brenn-queda-sem-escudo-brenn-capacete$D"
