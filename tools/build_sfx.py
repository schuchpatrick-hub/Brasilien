#!/usr/bin/env python3
"""Echte Geräusche für Serie, Samba-Show und Reise-Film: freie Aufnahmen (nur CC0) aus FSD50K (Freesound),
geladen von huggingface.co (Datensatz Fhrozen/FSD50k), zugeschnitten, in der Lautstärke angeglichen und als
ein Paket web/audio/sfx.mp3 gespeichert. Die Ausschnitte landen in trip.json → sfx {Name: [[Start s, Länge s, Lautstärke], …]};
Music() in page_script.html spielt dann die Aufnahme statt des synthetischen Klangs (fehlt ein Name, bleibt der Synth-Klang).

Ausgewählt mit einem AudioSet-Klassifikator (AST) aus den Kandidaten je Kategorie. Mehrere Clips je Name = Varianten (zufällig).
Aufruf: python3 tools/build_sfx.py   (Rohdateien werden in tools/data/sfx/ zwischengespeichert, gitignored)
"""
import json, os, subprocess, sys, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_series_audio import ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'data', 'sfx'); os.makedirs(RAW, exist_ok=True)
OUT = os.path.join(ROOT, 'web', 'audio', 'sfx.mp3'); TRIP = os.path.join(ROOT, 'web', 'trip.json')
URL = 'https://huggingface.co/datasets/Fhrozen/FSD50k/resolve/main/clips/{}/{}.wav'
SR = 44100

# Name: (Lautstärke, [(Split, Clip-ID, Modus, Länge s)]); Modus: on = ab dem Einsatz, peak = Fenster um die lauteste Stelle, Zahl = Start in s
# (bestes Fenster laut AST-Klassifikator)
PICK = {
    'fart': (.75, [('eval', 185226, 'on', 1.4), ('eval', 324451, 1.0, 1.2), ('eval', 346143, 'on', .8), ('eval', 346145, 'on', 1.2)]),
    'burp': (.7, [('dev', 51803, 'on', 1.0), ('eval', 201722, 'on', 1.0)]),
    'burpbig': (.8, [('dev', 399767, 'on', 2.2)]),
    'laugh': (0.45, [('dev', 262979, .75, 3.2), ('dev', 262975, .75, 3.2), ('dev', 262980, 1.5, 3.2)]),
    'applause': (.45, [('dev', 432329, 'on', 3.6), ('dev', 432333, 'on', 3.6)]),
    'cheer': (.5, [('eval', 353185, .25, 2.4)]),
    'thud': (.8, [('dev', 346692, .25, .6)]),
    'crash': (.6, [('dev', 276939, 'on', 1.8)]),
    'splash': (.65, [('dev', 243519, 2.0, 1.4), ('eval', 280219, 1.25, 1.4)]),
    'chomp': (1.0, [('dev', 364923, 'on', .55)]),
    'shutter': (.7, [('dev', 404846, 'on', .6)]),
    'clink': (.6, [('dev', 346696, 'on', .7), ('dev', 346701, 'on', .6)]),
    'squeak': (0.35, [('dev', 109826, 'on', .6), ('dev', 11567, 'on', .7)]),
    'tape': (0.5, [('dev', 119081, 'on', 1.2)]),
    'paper': (0.4, [('dev', 82372, 'on', .9)]),
    'scratch': (.7, [('dev', 431773, 'on', .9)]),
    'gong': (.6, [('dev', 411370, 'on', 2.6)]),
    'plane': (0.25, [('dev', 251962, 'peak', 4.0)]),
    'car': (0.3, [('dev', 241722, 'peak', 2.6)]),
    'handclaps': (0.7, [('dev', 151848, 'on', 1.2)]),
}

def load(split, cid):
    f = os.path.join(RAW, f'{cid}.wav')
    if not os.path.exists(f) or os.path.getsize(f) < 1000:
        try: urllib.request.urlretrieve(URL.format(split, cid), f)
        except Exception: urllib.request.urlretrieve(URL.format('eval' if split == 'dev' else 'dev', cid), f)
    raw = subprocess.run([ffmpeg(), '-loglevel', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def cut(x, mode, L):
    n = int(L * SR)
    if not isinstance(mode, str):
        a = int(mode * SR)
    elif mode == 'peak':
        w = int(.05 * SR); e = np.convolve(x * x, np.ones(w) / w, 'same'); c = int(np.argmax(e)); a = max(0, c - n // 2)
    else:
        thr = np.abs(x).max() * .06; a = max(0, int(np.argmax(np.abs(x) > thr)) - int(.01 * SR))
    y = x[a:a + n].copy()
    f = min(len(y) // 4, int(.08 * SR)); y[-f:] *= np.linspace(1, 0, f) ** 2   # weich ausblenden
    f2 = int(.004 * SR); y[:f2] *= np.linspace(0, 1, f2)
    rms, pk = np.sqrt((y ** 2).mean()) + 1e-9, np.abs(y).max() + 1e-9
    return y * min(.13 / rms, .89 / pk)   # gleiche Lautheit (RMS), Spitze höchstens −1 dBFS

# Raumklänge (Serie, META.amb): je Art ein Schleifen-Ausschnitt, nahtlos überblendet: Name: (Lautstärke, Split, Clip-ID, Start s, Länge s)
AMB = {
    'sea': (.5, 'eval', 418356, 4.0, 8), 'crowd': (.45, 'dev', 424866, 0.0, 8), 'bar': (.4, 'eval', 347537, 4.0, 8),
    'traffic': (.4, 'dev', 319360, 4.0, 8), 'wind': (.4, 'eval', 135447, 0.0, 8), 'rain': (.5, 'dev', 50058, 4.0, 8),
    'night': (.35, 'eval', 424871, 0.0, 8), 'falls': (.5, 'eval', 352903, 0.0, 8), 'forest': (.45, 'dev', 222635, 4.0, 8),
    'cabin': (.4, 'dev', 320786, 16.0, 8),
}

def loop(x, a, L, F=1.2):
    n, f = int(L * SR), int(F * SR); s = x[int(a * SR):int(a * SR) + n + f].copy()
    if len(s) < n + f: s = np.concatenate([s, x[:n + f - len(s)]])
    w = np.sin(np.linspace(0, np.pi / 2, f)) ** 2
    y = s[:n].copy(); y[:f] = s[:f] * w + s[n:n + f] * (1 - w)   # Ende läuft in den Anfang über
    rms = np.sqrt((y ** 2).mean()) + 1e-9
    return y * min(.1 / rms, .8 / (np.abs(y).max() + 1e-9))

def main():
    parts, sfx, pos, gap = [], {}, 0, int(.08 * SR)
    for name, (vol, split, cid, a, L) in AMB.items():
        y = loop(load(split, cid), a, L)
        sfx['amb_' + name] = [[round(pos / SR, 3), round(len(y) / SR, 3), vol]]
        parts += [y, np.zeros(gap, np.float32)]; pos += len(y) + gap
    for name, (vol, clips) in PICK.items():
        for split, cid, mode, L in clips:
            y = cut(load(split, cid), mode, L)
            sfx.setdefault(name, []).append([round(pos / SR, 3), round(len(y) / SR, 3), vol])
            parts += [y, np.zeros(gap, np.float32)]; pos += len(y) + gap
    pcm = (np.clip(np.concatenate(parts), -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-b:a', '112k', OUT], input=pcm, check=True)
    t = json.load(open(TRIP, encoding='utf-8')); t['sfx'] = sfx
    open(TRIP, 'w', encoding='utf-8').write(json.dumps(t, ensure_ascii=False, indent=2) + '\n')
    print(len(sfx), 'Geräusche,', sum(len(v) for v in sfx.values()), 'Clips,', round(pos / SR, 1), 's,', round(os.path.getsize(OUT) / 1e6, 2), 'MB')

if __name__ == '__main__':
    main()
