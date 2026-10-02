#!/usr/bin/env python3
"""Stimmen für die Samba-Show: Piper-Sprachausgabe, hochgepitcht wie Cartoon-Figuren (South-Park-Kanadier).

Schreibt web/audio/samba-<key>.mp3 und in web/trip.json → dance.voice je Clip Dauer (ms) und eine Lautstärkekurve
(`env`: eine Ziffer 0–9 pro 40 ms), nach der die Seite den Mund auf- und zuklappt.

Voraussetzungen: pip install piper-tts imageio-ffmpeg; Stimmen aus
https://github.com/rhasspy/piper/releases/tag/v0.0.2 (voice-de-thorsten-low, voice-de-karlsson-low, voice-de-pavoque-low,
voice-de-kerstin-low) entpackt in VOICES (Standard: tools/data/voices).
"""
import json, os, subprocess, sys, wave, struct, math, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = os.environ.get('VOICES', os.path.join(ROOT, 'tools', 'data', 'voices'))
TRIP = os.path.join(ROOT, 'web', 'trip.json')
OUT = os.path.join(ROOT, 'web', 'audio')

def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def env_of(path, step=0.04):
    w = wave.open(path); sr = w.getframerate(); n = w.getnframes()
    d = struct.unpack('<%dh' % n, w.readframes(n)); hop = int(sr * step)
    vals = [math.sqrt(sum(x * x for x in d[i:i + hop]) / max(1, len(d[i:i + hop]))) for i in range(0, n, hop)]
    top = max(vals) or 1
    return ''.join(str(min(9, int(v / top * 12))) for v in vals), round(n / sr * 1000)

def main():
    trip = json.load(open(TRIP, encoding='utf-8'))
    lines = trip['dance']['lines']
    F = ffmpeg(); voice = {}
    for ln in lines:
        key = ln['key']
        with tempfile.TemporaryDirectory() as tmp:
            raw = os.path.join(tmp, 'raw.wav'); pit = os.path.join(tmp, 'pit.wav')
            subprocess.run([sys.executable, '-m', 'piper', '-m', os.path.join(VOICES, ln['voice'] + '.onnx'), '-f', raw,
                            '--length-scale', str(ln.get('speed', 0.95))], input=ln['say'].encode(), check=True, capture_output=True)
            p = ln.get('pitch', 1.35)   # höher und gleich schnell: asetrate hebt, atempo bremst wieder
            sr = wave.open(raw).getframerate()
            subprocess.run([F, '-y', '-loglevel', 'error', '-i', raw, '-af',
                            f'asetrate={sr}*{p},aresample=44100,atempo={1 / p:.4f},highpass=f=120,loudnorm=I=-15',
                            '-ac', '1', '-ar', '44100', pit], check=True)
            env, dur = env_of(pit)
            subprocess.run([F, '-y', '-loglevel', 'error', '-i', pit, '-b:a', '96k', os.path.join(OUT, f'samba-{key}.mp3')], check=True)
        voice[key] = {'dur': dur, 'env': env}
        print(key, dur, 'ms')
    trip['dance']['voice'] = voice
    txt = json.dumps(trip, ensure_ascii=False, indent=2)
    open(TRIP, 'w', encoding='utf-8').write(txt + '\n')

if __name__ == '__main__':
    main()
