#!/usr/bin/env bash
# Importa as 9 folhas de arma da Dara numa armadura, com os nomes que o
# registro (`src/art/folhas/index.js`) entende: dara-<armadura>-<arma>.
#
# A malha e a armadura base: as folhas dela sairam das animacoes e das
# edicoes de arma. As outras saem das edicoes `armadura-<nome>` dessas
# mesmas folhas (`armaduras-dara.sh`), editadas so do lado leste -- dai o
# `--espelho`.
#
# Uso: bash src/dev/importar-dara.sh <malha|placas|reskins>
set -eu
ARM="$1"
R=_referencias/pixellab
M=$R/fighterMalha-65b1e8af
E=$R/fighterSemEscudo-c29a9610
D=$R/fighterDuasMaos-6e0dc359
A=$R/fighterArco-e113e412
B=$R/fighterBesta-3269c32a
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "dara-$ARM-$nome" "$@" \
    | grep -E "KB|medidas" || true
}
if [ "$ARM" = reskins ]; then
  # Os itens nomeados (src/dev/reskins-dara.py): mesmo perfil, espelho e
  # chao das folhas de onde sairam.
  P=-armadura-placas
  ARM=malha
  imp $M/anim-dara-sem-cauda-talon fighter talon-escudo
  imp $M/anim-dara-sem-cauda-arma-maca-lightbringer fighter lightbringer-escudo --espelho
  imp $M/anim-dara-sem-cauda-arma-machado-hew fighter hew-escudo --espelho
  ARM=placas
  imp $M/anim-dara-sem-cauda$P-talon fighter talon-escudo --espelho
  imp $M/anim-dara-sem-cauda-arma-maca$P-lightbringer fighter lightbringer-escudo --espelho --queda-de "$M/anim-dara-sem-cauda$P"
  imp $M/anim-dara-sem-cauda-arma-machado$P-hew fighter hew-escudo --espelho --queda-de "$M/anim-dara-sem-cauda$P"
  ARM=dragonguard
  Q=$M/anim-dara-sem-cauda$P-dragonguard
  imp $M/anim-dara-sem-cauda$P-dragonguard fighter espada-escudo --espelho
  imp $E/anim-postura-sem-cauda$P-dragonguard fighterSemEscudo espada --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda-arma-maca$P-dragonguard fighter maca-escudo --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda-arma-machado$P-dragonguard fighter machado-escudo --espelho --queda-de "$Q"
  imp $D/anim-postura-sem-cauda$P-dragonguard fighterEspadaGrande espada-grande --espelho --queda-de "$Q"
  imp $D/anim-postura-sem-cauda-arma-machado-grande$P-dragonguard fighterDuasMaos machado-grande --espelho --verde apagar --queda-de "$Q"
  imp $D/anim-postura-sem-cauda-arma-malho$P-dragonguard fighterDuasMaos malho --espelho --verde apagar --queda-de "$Q"
  imp $A/anim-postura-sem-cauda$P-dragonguard fighterArco arco --espelho --queda-de "$Q"
  imp $B/anim-postura-sem-cauda-cauda-creme$P-dragonguard fighterBesta besta --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda$P-talon-dragonguard fighter talon-escudo --espelho
  imp $M/anim-dara-sem-cauda-arma-maca$P-lightbringer-dragonguard fighter lightbringer-escudo --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda-arma-machado$P-hew-dragonguard fighter hew-escudo --espelho --queda-de "$Q"
elif [ "$ARM" = malha ]; then
  imp $M/anim-dara-sem-cauda fighter espada-escudo
  imp $E/anim-postura-sem-cauda fighterSemEscudo espada
  imp $M/anim-dara-sem-cauda-arma-maca fighter maca-escudo --espelho
  imp $M/anim-dara-sem-cauda-arma-machado fighter machado-escudo --espelho
  imp $D/anim-postura-sem-cauda fighterEspadaGrande espada-grande
  imp $D/anim-postura-sem-cauda-arma-machado-grande fighterDuasMaos machado-grande --espelho --verde apagar
  imp $D/anim-postura-sem-cauda-arma-malho fighterDuasMaos malho --espelho --verde apagar
  imp $A/anim-postura-sem-cauda fighterArco arco
  imp $B/anim-postura-sem-cauda-cauda-creme fighterBesta besta
else
  S="-armadura-$ARM"
  Q=$M/anim-dara-sem-cauda$S              # o corpo no chao vestido com a armadura
  imp $M/anim-dara-sem-cauda$S fighter espada-escudo --espelho
  imp $E/anim-postura-sem-cauda$S fighterSemEscudo espada --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda-arma-maca$S fighter maca-escudo --espelho --queda-de "$Q"
  imp $M/anim-dara-sem-cauda-arma-machado$S fighter machado-escudo --espelho --queda-de "$Q"
  imp $D/anim-postura-sem-cauda$S fighterEspadaGrande espada-grande --espelho --queda-de "$Q"
  imp $D/anim-postura-sem-cauda-arma-machado-grande$S fighterDuasMaos machado-grande --espelho --verde apagar --queda-de "$Q"
  imp $D/anim-postura-sem-cauda-arma-malho$S fighterDuasMaos malho --espelho --verde apagar --queda-de "$Q"
  imp $A/anim-postura-sem-cauda$S fighterArco arco --espelho --queda-de "$Q"
  imp $B/anim-postura-sem-cauda-cauda-creme$S fighterBesta besta --espelho --queda-de "$Q"
fi
