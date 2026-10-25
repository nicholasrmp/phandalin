#!/usr/bin/env bash
# Importa as folhas das criaturas da aventura feitas no PixelLab, com os nomes
# que `src/art/folhas/index.js` importa (uma folha por look).
#
#   lobo     esqueleto `dog`; o personagem animado e o `loboDirecoes` (as vistas
#            vieram giradas uma casa e foram reordenadas)
#   bugbear  as vistas da primeira leva num quadro de 80 (`bugbear80`)
#   klarg    o bugbear de pelo descorado (`reskins-klarg.py`, sem geracao)
#   marcarrubra  o bandido de manto escarlate (capitulo 3)
#   esqueleto, ratoGigante, vigiaCiclopico  as criaturas da mansao (o vigia:
#            vistas reordenadas e oeste espelhado, `vigiaDirecoes`)
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
# fragmentos soltos (um alaranjado no golpe a leste do esqueleto, um no andar do rato ao norte)
python src/dev/limpar-soltos.py --fonte $R/esqueleto-dea75747/anim --perfil esqueleto --direcoes east --maximo 100 > /dev/null
python src/dev/limpar-soltos.py --fonte $R/ratoGigante-17969ee0/anim --perfil ratoGigante --direcoes north --maximo 40 > /dev/null
python src/dev/importar-pixellab.py --fonte $R/esqueleto-dea75747/anim --chave esqueleto --nome esqueleto | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $R/ratoGigante-17969ee0/anim --chave ratoGigante --nome ratoGigante | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $R/vigiaDirecoes-9dc830bb/anim --chave vigiaDirecoes --nome vigiaCiclopico | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $R/cajavidro-0f95b93e/anim --chave cajavidro --nome cajavidro | grep -E "KB" || true
# o hobgoblin (capitulo 4): espada e escudo e o arco longo, de cabelo preto
# (edicoes `hob-base-preto` e `hob-arco-preto`); a queda do arco e a da base
H=$R/hob-8137702c/anim
python src/dev/importar-pixellab.py --fonte "$H" --chave hob --nome hobgoblin | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $R/hobArco-8918ccbc/anim --chave hobArco --nome hobgoblinArco --queda-de "$H" | grep -E "KB" || true
