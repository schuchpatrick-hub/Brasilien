#!/usr/bin/env python3
"""Stimmen für die Samba-Show (sherpa-onnx, hochwertige Piper-/Coqui-Stimmen).

Gesprochene Zeilen: Sprachausgabe, dann mit Rubberband leicht hochgepitcht (Cartoon) und auf gleiche Lautstärke gebracht.
Gesungene Zeilen (`sing`): jede Silbe einzeln gesprochen, auf die Tonhöhe der Melodie gezogen und im Takt aneinandergesetzt.
Schreibt web/audio/samba-<key>.mp3 und in web/trip.json → dance.voice je Aufnahme Dauer (ms) und Lautstärkekurve
(`env`: eine Ziffer 0–9 pro 40 ms), nach der die Seite den Mund auf- und zuklappt.

Voraussetzungen: pip install sherpa-onnx soundfile numpy imageio-ffmpeg; Stimmen aus
https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models (vits-piper-de_DE-thorsten-high, vits-piper-de_DE-miro-high,
vits-piper-de_DE-thorsten_emotional-medium, vits-coqui-de-css10, vits-piper-pt_BR-faber-medium) entpackt in VOICES
(Standard: tools/data/voices). Aufruf: python3 tools/gen_dance_audio.py [key …] (ohne Keys: alle); Serien-Folge: python3 tools/gen_dance_audio.py --series ep1 [key …].
"""
import glob, json, math, os, subprocess, sys, tempfile, wave
import numpy as np, soundfile as sf, sherpa_onnx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICES = os.environ.get('VOICES', os.path.join(ROOT, 'tools', 'data', 'voices'))
TRIP = os.path.join(ROOT, 'web', 'trip.json')
OUT = os.path.join(ROOT, 'web', 'audio')
TEMPO = 0.9   # muss zu SLOW in page_script.html passen
NOTE = {'F3': 174.61, 'G3': 196.0, 'A3': 220.0, 'Bb3': 233.08, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'A4': 440.0}

def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

_tts = {}
def synth(model, text, sid=0, speed=1.0):
    if model not in _tts:
        d = os.path.join(VOICES, model); onnx = glob.glob(d + '/*.onnx')[0]
        vits = sherpa_onnx.OfflineTtsVitsModelConfig(model=onnx, tokens=d + '/tokens.txt',
                                                     data_dir=d + '/espeak-ng-data' if os.path.isdir(d + '/espeak-ng-data') else '')
        _tts[model] = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=vits, num_threads=2)))
    a = _tts[model].generate(text, sid=sid, speed=speed)
    return np.array(a.samples, dtype=np.float32), a.sample_rate

def run_ff(src, dst, af):
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ac', '1', '-ar', '44100', dst], check=True)

def f0(x, sr):
    fr = int(.04 * sr); vals = []
    for i in range(0, len(x) - fr, fr // 2):
        s = x[i:i + fr]
        if np.sqrt((s * s).mean()) < .03: continue
        c = np.correlate(s, s, 'full')[fr - 1:]; lo, hi = int(sr / 400), int(sr / 70)
        vals.append(sr / (lo + np.argmax(c[lo:hi])))
    return float(np.median(vals)) if vals else 150.0

def trim(x, thr=.02):
    idx = np.where(np.abs(x) > thr)[0]
    return x[idx[0]:idx[-1] + 1] if len(idx) else x

def spoken(v, text, tmp):
    x, sr = synth(v['model'], text, v.get('sid', 0), v.get('speed', 1.0))
    raw = os.path.join(tmp, 'raw.wav'); sf.write(raw, x, sr)
    out = os.path.join(tmp, 'out.wav'); p = v.get('pitch', 1.0)
    af = (f'rubberband=pitch={p}:formant=shifted,' if p != 1 else '') + v.get('fx', 'highpass=f=90') + ',loudnorm=I=-15'
    run_ff(raw, out, af); return out

def sung(v, melody, tmp):
    """Silben einzeln sprechen, auf Zieltöne ziehen (Rubberband) und im Takt aneinandersetzen."""
    sr = 44100; parts = []; shift = 2 ** (v.get('semi', 0) / 12)
    for k, (syl, note, ms) in enumerate(melody):
        x, s0 = synth(v.get('singer', v['model']), syl, v.get('ssid', 0), 1.0); x = trim(x)
        src = os.path.join(tmp, f's{k}.wav'); dst = os.path.join(tmp, f'd{k}.wav'); sf.write(src, x, s0)
        ratio = NOTE[note] * shift / f0(x, s0); dur = len(x) / s0; tempo = dur / (ms / 1000 * .92)
        run_ff(src, dst, f'rubberband=pitch={ratio:.4f}:tempo={tempo:.4f}:formant=shifted,afade=t=out:st={ms / 1000 * .8:.3f}:d=0.05')
        y, _ = sf.read(dst); n = int(sr * ms / 1000); y = np.pad(y, (0, max(0, n - len(y))))[:n]; parts.append(y)
    out = os.path.join(tmp, 'sung.wav'); sf.write(out, np.concatenate(parts), sr)
    out2 = os.path.join(tmp, 'sung2.wav'); run_ff(out, out2, 'aecho=0.8:0.5:40:0.15,loudnorm=I=-15'); return out2

# Serien-Stimmen: Stille an den Enden weg (Mund passt genauer), Rumpeln raus, Präsenz rauf, gleichmäßig laut
POLISH = ('silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.02,areverse,'
          'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12,areverse,'
          'highpass=f=85,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=7500:t=q:w=1:g=-1.5,'
          'acompressor=threshold=-21dB:ratio=3:attack=4:release=70:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7,afade=t=in:d=0.012')

def env_of(path, step=0.04):
    w = wave.open(path); sr = w.getframerate(); n = w.getnframes()
    d = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float32); hop = int(sr * step)
    vals = [math.sqrt(float((d[i:i + hop] ** 2).mean())) for i in range(0, n, hop)]
    top = max(vals) or 1
    return ''.join(str(min(9, int(v / top * 12))) for v in vals), round(n / sr * 1000)

def main():
    trip = json.load(open(TRIP, encoding='utf-8')); dance = trip['dance']; args = sys.argv[1:]
    # --series ep1: Zeilen einer Serien-Folge (trip.json → series.ep1), Dateien web/audio/ep1-<key>.mp3, ohne Dehnung
    ep = args[args.index('--series') + 1] if '--series' in args else None
    only = set(a for a in args if a != '--series' and a != ep)
    if ep:
        data = trip['series'][ep]; voices = dict(dance['voices'], **trip['series'].get('voices', {})); prefix, tempo = ep + '-', 1.0
    else:
        data = dance; voices = dance['voices']; prefix, tempo = 'samba-', TEMPO
    voice = data.get('voice', {})
    for ln in data['lines']:
        if ln.get('src') or ln.get('nogen'): continue   # benutzt Aufnahmen anderer Zeilen
        for alt in [ln] + ln.get('alts', []):
            key = alt['key']
            if only and key not in only: continue
            v = dict(voices[ln.get('voice', ln['who'])]); v.update(ln.get('vo', {}))
            with tempfile.TemporaryDirectory() as tmp:
                wav = sung(v, dance['melodies'][alt.get('mel', ln.get('mel', 'ole'))], tmp) if ln.get('sing') else spoken(v, alt['say'], tmp)
                pcm = os.path.join(tmp, 'pcm.wav'); run_ff(wav, pcm, 'anull')
                env, dur = env_of(pcm)   # Dauer/Mundkurve in Showzeit
                # die Seite spielt die Show um SLOW = 1/0,9 langsamer ab: Aufnahme gleich mitdehnen (Tonhöhe bleibt)
                if ep:   # Serie: nachbearbeiten, dann Dauer/Mundkurve neu messen
                    pol = os.path.join(tmp, 'pol.wav'); run_ff(pcm, pol, POLISH); pcm = os.path.join(tmp, 'pcm2.wav'); run_ff(pol, pcm, 'anull'); env, dur = env_of(pcm)
                slow = os.path.join(tmp, 'slow.wav'); run_ff(pcm, slow, f'rubberband=tempo={tempo}:pitch=1' if tempo != 1 else 'anull')
                subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', slow, '-b:a', '128k' if ep else '96k', os.path.join(OUT, f'{prefix}{key}.mp3')], check=True)
            voice[key] = {'dur': dur, 'env': env}
            print(key, dur, 'ms')
    data['voice'] = voice
    open(TRIP, 'w', encoding='utf-8').write(json.dumps(trip, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main()
