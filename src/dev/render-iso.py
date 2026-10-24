# -*- coding: utf-8 -*-
"""
Fotografa um modelo 3D (.glb) no ângulo EXATO do tabuleiro, nas quatro
rotações da câmera, para virar sprite de prédio.

Roda dentro do Blender, sem janela:

  blender -b -P src/dev/render-iso.py -- MODELO.glb SAIDA/ CASAS_X CASAS_Y

A GEOMETRIA DO TABULEIRO (`view/board.js`): o losango de uma casa tem 64 x 32
px, ou seja, uma casa de 1,5 m vista de 45 graus e de cima a 30 graus (seno
de 30 = 0,5 = 32/64). Na câmera ortográfica isso dá 64 / (1,5 * raiz 2) =
30,17 px por metro na horizontal e ~26 px por metro na vertical — a mesma
escala dos personagens (um humano de 1,8 m tem ~45 px). Então NADA é
esticado: o prédio sai na escala das figuras e assenta na pegada certa.

AS QUATRO ROTAÇÕES. A câmera fica do lado da "frente" da vista: na rotação 0
do tabuleiro a frente é +x +y da grade; na 1, +x −y; na 2, −x −y; na 3,
−x +y (ver `toView`). No Blender a grade vira (x, −y).

O modelo é escalado para caber em CASAS_X x CASAS_Y casas (a pegada), com o
centro da pegada na origem e a base no chão. Sai um PNG por rotação, fundo
transparente, sem suavização, e um JSON com a âncora (o pixel do centro da
pegada no chão) de cada um.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

args = sys.argv[sys.argv.index('--') + 1:]
MODELO, SAIDA = Path(args[0]), Path(args[1])
CX, CY = int(args[2]), int(args[3])
CASA = 1.5                                  # metros
PX_POR_M = 64 / (CASA * math.sqrt(2))       # 30,17
SAIDA.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------- cena limpa --
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=str(MODELO))
malhas = [o for o in cena.objects if o.type == 'MESH']

# Caixa do modelo no mundo.
pts = [o.matrix_world @ Vector(c) for o in malhas for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
dim = mx - mn
# Escala: o lado maior do modelo cabe no lado maior da pegada (90%, para
# sobrar beiral), o menor no menor.
alvo = sorted([CX * CASA, CY * CASA])
lados = sorted([dim.x, dim.y])
esc = min(alvo[0] / lados[0], alvo[1] / lados[1]) * 0.92
# Se o lado comprido do modelo está em y mas a pegada é mais larga em x, gira.
girar = (dim.x >= dim.y) != (CX >= CY)
raiz = bpy.data.objects.new('raiz', None)
cena.collection.objects.link(raiz)
for o in cena.objects:
    if o is not raiz and o.parent is None:
        o.parent = raiz
centro = (mn + mx) / 2
raiz.location = (0, 0, 0)
for o in list(raiz.children):
    o.location -= Vector((centro.x, centro.y, mn.z))
raiz.scale = (esc, esc, esc)
if girar:
    raiz.rotation_euler = (0, 0, math.radians(90))
bpy.context.view_layer.update()

# ---------------------------------------------------------------- luz ------
mundo = bpy.data.worlds.new('mundo')
cena.world = mundo
mundo.use_nodes = True
fundo = mundo.node_tree.nodes['Background']
fundo.inputs['Color'].default_value = (0.55, 0.55, 0.6, 1)
fundo.inputs['Strength'].default_value = 0.9
sol = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN'))
sol.data.energy = 3.2
cena.collection.objects.link(sol)

# -------------------------------------------------------------- render -----
cena.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
cena.render.film_transparent = True
cena.render.filter_size = 0.01             # sem suavização: pixel duro
cena.render.image_settings.file_format = 'PNG'
cena.render.image_settings.color_mode = 'RGBA'
cena.view_settings.view_transform = 'Standard'

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
cena.collection.objects.link(cam)
cena.camera = cam
cam.data.type = 'ORTHO'

# Tamanho da imagem: a pegada e a altura do modelo, com folga.
altura = dim.z * esc
larg_px = int((CX + CY) * 64 / 2 + 24)
alt_px = int((CX + CY) * 32 / 2 + altura * PX_POR_M + 24)
cena.render.resolution_x = larg_px
cena.render.resolution_y = alt_px
cena.render.resolution_percentage = 100
cam.data.ortho_scale = max(larg_px, alt_px) / PX_POR_M

FRENTE = [(1, 1), (1, -1), (-1, -1), (-1, 1)]   # da grade, por rotação
meta = {'pegada': [CX, CY], 'quadros': {}}
for r, (gx, gy) in enumerate(FRENTE):
    bx, by = gx, -gy                           # grade -> Blender
    az = math.atan2(by, bx)
    el = math.radians(30)
    d = 60.0
    alvo_v = Vector((0, 0, altura * 0.35))
    cam.location = alvo_v + Vector((math.cos(el) * math.cos(az) * d, math.cos(el) * math.sin(az) * d, math.sin(el) * d))
    direcao = (alvo_v - cam.location).normalized()
    cam.rotation_euler = direcao.to_track_quat('-Z', 'Y').to_euler()
    # Luz do alto à esquerda da TELA, em toda rotação.
    sol.rotation_euler = cam.rotation_euler.copy()
    sol.rotation_euler.rotate_axis('Y', math.radians(-35))
    sol.rotation_euler.rotate_axis('X', math.radians(-25))
    bpy.context.view_layer.update()
    arq = SAIDA / f'rot{r}.png'
    cena.render.filepath = str(arq)
    bpy.ops.render.render(write_still=True)
    u = world_to_camera_view(cena, cam, Vector((0, 0, 0)))
    meta['quadros'][r] = {'arquivo': arq.name, 'ax': round(u.x * larg_px), 'ay': round((1 - u.y) * alt_px)}
(SAIDA / 'render.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
print('OK', meta)
