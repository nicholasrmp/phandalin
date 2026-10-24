#!/usr/bin/env bash
# Importa as folhas do Ilvan com os nomes que o registro entende:
# ilvan-roupa-<arma> (`src/art/folhas/index.js`).
#
# Kit decidido com o dono: bordao (a base), adaga e os cajados da aventura
# (Cajado de Defesa e Cajado Aranha, reskin do bordao em
# `src/dev/reskins-ilvan.py`). Sem armadura. Todas trazem a animacao
# `conjurar`, o gesto de magia (perfil `conjurar` em `importar-pixellab.py`).
# As oito direcoes sao as do modelo, sem espelho.
#
# Uso: bash src/dev/importar-ilvan.sh   (antes: python src/dev/reskins-ilvan.py)
set -eu
R=_referencias/pixellab
W=$R/wizard-864b31dd
A=$R/wizardAdaga-fd8b518d
imp() {   # fonte chave nome [opcoes...]
  local fonte=$1 chave=$2 nome=$3; shift 3
  python src/dev/importar-pixellab.py --fonte "$fonte" --chave "$chave" --nome "ilvan-roupa-$nome" "$@" \
    | grep -E "KB" || true
}
imp $W/anim wizard bordao
imp $W/anim-cajado-defesa wizard cajado-defesa
imp $W/anim-cajado-aranha wizard cajado-aranha
imp $A/anim wizardAdaga adaga --queda-de "$W/anim-ilvan-queda-sem-cajado"
