#!/usr/bin/env python3
"""Packt alle Stimmen einer Serien-Folge in eine Datei: web/audio/epN.mp3 (ein Download statt ~50).

Quelle sind die einzelnen Aufnahmen web/audio/epN-<key>.mp3 (von gen_dance_audio.py --series epN).
Der Versatz jeder Zeile landet in trip.json → series.epN.voice[key].o (Millisekunden); die Seite spielt
daraus nur den passenden Ausschnitt. Beim Veröffentlichen nur epN.mp3 mitgeben, die Einzeldateien nicht.
Aufruf: python3 tools/build_series_audio.py [ep1 ep2 …]   (ohne Angabe: alle Folgen)
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRIP = os.path.join(ROOT, 'web', 'trip.json'); AUD = os.path.join(ROOT, 'web', 'audio')
SR, GAP = 44100, 0.25   # Pause zwischen den Zeilen im Paket (Sekunden)

def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return 'ffmpeg'

def pcm(path):
    raw = subprocess.run([ffmpeg(), '-loglevel', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<i2')

def main():
    trip = json.load(open(TRIP, encoding='utf-8')); series = trip['series']
    eps = sys.argv[1:] or sorted((k for k in series if re.fullmatch(r'ep\d+', k)), key=lambda k: int(k[2:]))
    for ep in eps:
        data = series[ep]; parts = []; pos = int(GAP * SR); gap = np.zeros(int(GAP * SR), dtype='<i2'); parts.append(gap)
        for ln in data['lines']:
            x = pcm(os.path.join(AUD, f"{ep}-{ln['key']}.mp3"))
            data['voice'][ln['key']]['o'] = round(pos * 1000 / SR)
            parts += [x, gap]; pos += len(x) + len(gap)
        out = os.path.join(AUD, f'{ep}.mp3')
        subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '128k', out],
                       input=np.concatenate(parts).tobytes(), check=True)
        print(ep, len(data['lines']), 'Zeilen,', round(pos / SR, 1), 's,', round(os.path.getsize(out) / 1e6, 2), 'MB')
    open(TRIP, 'w', encoding='utf-8').write(json.dumps(trip, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
