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
# o lobo atroz: vistas reordenadas e escurecidas (`atroz-tira.py`), animado
# como `loboAtrozDirecoes`
python src/dev/importar-pixellab.py --fonte $R/loboAtrozDirecoes-b6f29a8c/anim --chave loboAtrozDirecoes --nome loboAtroz | grep -E "KB" || true
# o orc (pelo modelo oficial que o dono mandou) e o Brughor (edicao `brughor`)
python src/dev/importar-pixellab.py --fonte $R/orc-a5b5b49d/anim --chave orc --nome orc | grep -E "KB" || true
python src/dev/limpar-soltos.py --fonte $R/brughor-3f492294/anim --perfil brughor --direcoes north-east,north,north-west --maximo 40 > /dev/null
python src/dev/importar-pixellab.py --fonte $R/brughor-3f492294/anim --chave brughor --nome brughor | grep -E "KB" || true
# o ogro: a primeira leva engordada pela edicao `ogro-gordo` (duas metades)
python src/dev/importar-pixellab.py --fonte $R/ogroGordo-0fa8db1f/anim --chave ogroGordo --nome ogro | grep -E "KB" || true
# o Rei Grol: o bugbear de 80 editado em rei (`rei-grol`); a leste o machado
# visivel por `editar-quadros.py grol-machado` (10 geracoes)
python src/dev/limpar-soltos.py --fonte $R/reiGrol-47bddeb0/anim-grol-machado --perfil reiGrol --direcoes north --maximo 40 > /dev/null
python src/dev/importar-pixellab.py --fonte $R/reiGrol-47bddeb0/anim-grol-machado --chave reiGrol --nome reiGrol | grep -E "KB" || true
# a coruja-urso: vistas reordenadas e sem as manchas laranja (`coruja-tira.py`);
# o oeste espelhado do leste (o oeste do modelo mostrava a cabeca quase de costas)
python src/dev/importar-pixellab.py --fonte $R/corujaUrsoDirecoes-0b27aa8a/anim --chave corujaUrsoDirecoes --nome corujaUrso --espelho | grep -E "KB" || true
# o zumbi (pelo modelo oficial que o dono mandou)
python src/dev/limpar-soltos.py --fonte $R/zumbi-9e22a41a/anim --perfil zumbi --direcoes north-east --maximo 12 > /dev/null
python src/dev/importar-pixellab.py --fonte $R/zumbi-9e22a41a/anim --chave zumbi --nome zumbi | grep -E "KB" || true
# o grick: a vista sul aprovada pelo dono (OpenArt pela imagem oficial, `grick-ref/`)
python src/dev/importar-pixellab.py --fonte $R/grick-e549e8d9/anim --chave grick --nome grick | grep -E "KB" || true
# o carnical (ghoul): criado pela descricao da imagem do dono, aprovado por ele
python src/dev/importar-pixellab.py --fonte $R/carnical-411d9337/anim --chave carnical --nome carnical | grep -E "KB" || true
# Hamun Kost, o Mago Vermelho (pela imagem do dono, aprovado por ele)
python src/dev/importar-pixellab.py --fonte $R/hamunKost-26b06292/anim --chave hamunKost --nome hamunKost | grep -E "KB" || true
# o doppelganger na forma verdadeira (pela imagem do dono, aprovado por ele)
python src/dev/importar-pixellab.py --fonte $R/doppelganger-9b10d837/anim --chave doppelganger --nome doppelganger | grep -E "KB" || true
# a drow (aprovada pelo dono): espada (`drow`) e besta de mao (`drowBesta`, o
# golpe vindo do `drowTiro`)
python src/dev/importar-pixellab.py --fonte $R/drowEspada-4267c440/anim-drow-besta --chave drowEspada --nome drow | grep -E "KB" || true
T=$R/drowTiro-441ae051/anim
python src/dev/importar-pixellab.py --fonte $R/drowEspada-4267c440/anim-drow-besta --chave drowEspada --nome drowBesta   --ataque-de south=$T:3,5 --ataque-de south-east=$T:3,5 --ataque-de east=$T:3,4 --ataque-de north-east=$T:3,5   --ataque-de north=$T:3,5 --ataque-de north-west=$T:3,4 --ataque-de west=$T:3,4 --ataque-de south-west=$T:3,5 | grep -E "KB" || true
# o stirge: a vista de 24 px escolhida pelo dono (OpenArt pelas imagens dele)
python src/dev/importar-pixellab.py --fonte $R/stirge-9c6017a5/anim --chave stirge --nome stirge | grep -E "KB" || true
# a aranha gigante (aprovada pelo dono): a Mordida e a Teia (`anim-so-teia`, as
# fileiras da teia separadas da folha do mesmo personagem), e o floco de teia
# solto do andar apagado
A=$R/aranhaGigante-d547674e
python src/dev/importar-pixellab.py --fonte $A/anim --chave aranhaGigante --nome aranhaGigante | grep -E "KB" || true
python src/dev/importar-pixellab.py --fonte $A/anim-so-teia --chave aranhaGiganteTeia --nome aranhaGiganteTeia --queda-de $A/anim | grep -E "KB" || true
python src/dev/limpar-teia-aranha.py
# o Nezznar, a Aranha Negra (aprovado pelo dono): o golpe de sul e a queda vem
# da refacao (`anim-sul-novo`, so as fileiras novas da segunda leva)
N=$R/nezznar-dcf083b3
python src/dev/importar-pixellab.py --fonte $N/anim --chave nezznar --nome nezznar --queda-de $N/anim-sul-novo --ataque-de south=$N/anim-sul-novo:1,2 | grep -E "KB" || true
