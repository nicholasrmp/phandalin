# -*- coding: utf-8 -*-
"""
PREPARA a trilha sonora para o jogo: pega as faixas brutas (geradas fora, uma pasta de .mp3) e escreve `public/musica/*.mp3`.

    python -P src/dev/preparar-trilha.py "C:/Users/Niczin/Downloads/trilha sonora"

Por faixa (precisa do ffmpeg no PATH; nao gasta nada alem de CPU):
  - LAÇOS (as 8 faixas que ficam tocando): volume medido e levado a -20 LUFS (musica de jogo fica por baixo dos efeitos; as brutas
    vinham a -12 LUFS, com picos acima de 0 dBFS), pico real em -2 dB, e a EMENDA do laço refeita: os ultimos 5 s se fundem com os
    5 s do começo (acrossfade), de modo que o fim cai de volta no começo sem corte nem silencio.
  - TOQUES (vitoria e derrota, que vieram com 1 a 2 minutos): so o começo, com a cauda em fade, e o mesmo volume.
  - Saida em MP3 stereo 128 kbps (~2,8 MB por faixa de 3 minutos).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / 'public' / 'musica'

LACOS = ['exploracao-estrada', 'vila-phandalin', 'taverna', 'caverna-onda-eco', 'masmorra-mansao', 'luta', 'luta-chefe', 'acampamento']
# (nome, duracao em segundos, fade-out em segundos)
TOQUES = [('vitoria', 11.0, 2.5), ('derrota', 7.0, 1.6)]
ALVO_LUFS = -20.0
PICO_DB = -2.0
EMENDA_S = 5.0


def ffmpeg(*args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', *args], capture_output=True, text=True, encoding='utf-8', errors='replace')


def medir(entrada):
    """Primeira passada do loudnorm: devolve o que o ffmpeg mediu (JSON)."""
    p = ffmpeg('-i', str(entrada), '-af', f'loudnorm=I={ALVO_LUFS}:TP={PICO_DB}:LRA=11:print_format=json', '-f', 'null', '-')
    achados = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', p.stderr, re.S)
    if not achados:
        raise SystemExit(f'nao consegui medir {entrada}:\n{p.stderr[-400:]}')
    return json.loads(achados[-1])


def duracao(entrada):
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(entrada)], capture_output=True, text=True)
    return float(p.stdout.strip())


def normalizar(m):
    """O filtro da segunda passada, linear (sem bombear), com o que foi medido."""
    return (f'loudnorm=I={ALVO_LUFS}:TP={PICO_DB}:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
            f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')


def laco(origem, destino):
    d = duracao(origem)
    corpo = f'atrim=start={EMENDA_S}:end={d},asetpts=PTS-STARTPTS'
    cabeca = f'atrim=start=0:end={EMENDA_S},asetpts=PTS-STARTPTS'
    # O corpo vai ate o fim, e a cabeça (o começo) se funde na cauda dele: quando o arquivo repete, o fim é o começo da cabeça.
    filtro = f'[0:a]{corpo}[c];[0:a]{cabeca}[h];[c][h]acrossfade=d={EMENDA_S}:c1=tri:c2=tri[x]'
    temp = destino.with_suffix('.tmp.wav')
    p = ffmpeg('-i', str(origem), '-filter_complex', filtro, '-map', '[x]', str(temp))
    if p.returncode:
        raise SystemExit(p.stderr[-500:])
    m = medir(temp)
    p = ffmpeg('-i', str(temp), '-af', normalizar(m), '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', str(destino))
    temp.unlink(missing_ok=True)
    if p.returncode:
        raise SystemExit(p.stderr[-500:])
    return d


def toque(origem, destino, dur, fade):
    temp = destino.with_suffix('.tmp.wav')
    p = ffmpeg('-i', str(origem), '-t', str(dur), '-af', f'afade=t=out:st={dur - fade}:d={fade}', str(temp))
    if p.returncode:
        raise SystemExit(p.stderr[-500:])
    m = medir(temp)
    p = ffmpeg('-i', str(temp), '-af', normalizar(m), '-ar', '44100', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', str(destino))
    temp.unlink(missing_ok=True)
    if p.returncode:
        raise SystemExit(p.stderr[-500:])


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    pasta = Path(sys.argv[1])
    SAIDA.mkdir(parents=True, exist_ok=True)
    for nome in LACOS:
        origem = pasta / f'{nome}.mp3'
        d = laco(origem, SAIDA / f'{nome}.mp3')
        print(f'{nome}: laço de {d - EMENDA_S:.0f} s ({(SAIDA / f"{nome}.mp3").stat().st_size / 1e6:.1f} MB)')
    for nome, dur, fade in TOQUES:
        toque(pasta / f'{nome}.mp3', SAIDA / f'{nome}.mp3', dur, fade)
        print(f'{nome}: toque de {dur:.0f} s ({(SAIDA / f"{nome}.mp3").stat().st_size / 1e6:.2f} MB)')


if __name__ == '__main__':
    main()
