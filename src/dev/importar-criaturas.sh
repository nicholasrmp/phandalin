#!/usr/bin/env bash
# Importa as folhas das criaturas da aventura feitas no PixelLab, com os nomes
# que `src/art/folhas/index.js` importa (uma folha por look).
#
#   lobo     esqueleto `dog`; o personagem animado e o `loboDirecoes` (as vistas
#            vieram giradas uma casa e foram reordenadas)
#   bugbear  as vistas da primeira leva num quadro de 80 (`bugbear80`)
#   klarg    o bugbear de pelo descorado (`reskins-klarg.py`, sem geracao)
#   marcarrubra  o bandido de manto escarlate (capitulo 3)
#
# Uso: bash src/dev/importar-criaturas.sh
set -eu
R=_referencias/pixellab
python src/dev/importar-pixellab.py --fonte $R/loboDirecoes-5541d62a/anim --chave loboDirecoes --nome lobo | grep -E "KB" || true
B=$R/bugbear80-74cb7600/anim
# os pingos vermelhos que o golpe solta ao sul e a oeste
python src/dev/limpar-soltos.py --fonte "$B" --perfil bugbear80 --direcoes south,west --maximo 80 > /dev/null
# a clava visivel a leste e ao norte (`editar-quadros.py bugbear-clava`, 20 geracoes)
E=$B-bugbear-clava
python src/dev/reskins-klarg.py "$E" > /dev/null
python src/dev/importar-pixellab.py --fonte "$E" --chave bugbear80 --nome bugbear | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte "$E-klarg" --chave klarg --nome klarg | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $R/marcarrubra-0a566110/anim --chave marcarrubra --nome marcarrubra | grep -E "KB" || true
