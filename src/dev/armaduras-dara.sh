#!/usr/bin/env bash
# Veste a Dara com uma armadura em TODAS as folhas de arma dela.
#
# ISTO GASTA GERACOES: 9 folhas x 5 direcoes x 10 = ~450 por armadura (o
# oeste e espelhado do leste na importacao). Sem `--go` so mostra o plano.
#
# Uso: PIXELLAB_TOKEN=... bash src/dev/armaduras-dara.sh <placas|escamas|couro|peles|roupa> [--go]
set -u
ARM="$1"; GO="${2:-}"
R=_referencias/pixellab
L=south,south-east,east,north-east,north
# fonte | perfil de quadros | extra
FOLHAS=(
  "$R/fighterMalha-65b1e8af/anim-dara-sem-cauda|fighter|--com-queda"
  "$R/fighterSemEscudo-c29a9610/anim-postura-sem-cauda|fighterSemEscudo|"
  "$R/fighterMalha-65b1e8af/anim-dara-sem-cauda-arma-maca|fighter|"
  "$R/fighterMalha-65b1e8af/anim-dara-sem-cauda-arma-machado|fighter|"
  "$R/fighterDuasMaos-6e0dc359/anim-postura-sem-cauda|fighterDuasMaos|"
  "$R/fighterDuasMaos-6e0dc359/anim-postura-sem-cauda-arma-machado-grande|fighterDuasMaos|"
  "$R/fighterDuasMaos-6e0dc359/anim-postura-sem-cauda-arma-malho|fighterDuasMaos|"
  "$R/fighterArco-e113e412/anim-postura-sem-cauda|fighterArco|"
  "$R/fighterBesta-3269c32a/anim-postura-sem-cauda-cauda-creme|fighterBesta|"
)
mkdir -p "$R/armaduras"
for f in "${FOLHAS[@]}"; do
  IFS='|' read -r fonte perfil extra <<< "$f"
  log="$R/armaduras/$ARM-$(basename "$(dirname "$fonte")" | cut -c1-14)-$(basename "$fonte").log"
  python -u src/dev/editar-quadros.py "armadura-$ARM" --perfil "$perfil" --fonte "$fonte" \
    --direcoes "$L" $extra $GO > "$log" 2>&1 &
done
wait
grep -h "folha editada\|HTTP\|falhou\|geracoes declaradas" "$R"/armaduras/"$ARM"-*.log
